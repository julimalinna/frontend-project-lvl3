/* eslint-disable consistent-return */
import 'bootstrap';
import './style.scss';
import * as yup from 'yup';
import i18n from 'i18next';
import watchedState from './view.js';
import ru from './locales/ru.js';

const parseRSS = (xmlString) => {
  const parser = new DOMParser();
  return parser.parseFromString(xmlString, 'application/xml');
};

const addFeed = (id, parsedRSS, url) => {
  ru.translation.fiedsURLs.push({ id, url });
  const fiedDescription = parsedRSS.querySelector('description').textContent;
  const fiedTitle = parsedRSS.querySelector('title').textContent;
  ru.translation.fieds.push({
    id, title: fiedTitle, description: fiedDescription, link: url,
  });
};

let postId = 1;

const addPosts = (id, items, postsName) => {
  items.forEach((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    ru.translation[postsName].push({
      id, postId, title, description, link,
    });
    postId += 1;
  });
};

const render = (target) => {
  const { id } = target.dataset;
  const activePost = ru.translation.posts.filter((post) => post.postId === Number(id));
  const [post] = activePost;

  const h5 = document.querySelector('.modal-title');
  h5.textContent = post.title;
  const modalBody = document.querySelector('.modal-body');
  modalBody.textContent = post.description;
  const aFooterElement = document.querySelector('.modal-footer').querySelector('a');
  aFooterElement.setAttribute('href', post.link);

  const container = document.querySelector('.fade');
  container.classList.add('show');
  container.setAttribute('aria-modal', 'true');
  container.setAttribute('style', 'display: block; padding-right: 15px;');
  container.removeAttribute('aria-hidden');

  const aPostElement = target.previousElementSibling;
  aPostElement.classList.replace('font-weight-bold', 'font-weight-normal');
};

export default () => {
  i18n.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru,
    },
  });

  yup.setLocale({
    string: {
      url: () => ('form.errors.invalidURL'),
    },
  });

  const schema = yup.object().shape({
    url: yup.string().required().url(),
  });

  let i = 1;

  const form = document.querySelector('form');
  const input = document.querySelector('input');
  const posts = document.querySelector('.posts');

  const addNewRssPosts = () => {
    ru.translation.fiedsURLs.forEach((url) => {
      watchedState.newPostsId = url.id;
      fetch(`https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url.url)}`)
        .then((response) => {
          if (response.ok) return response.json();
          throw new Error('Network response was not ok.');
        })
        .then((data) => parseRSS(data.contents))
        .then((parsedRSS) => parsedRSS.querySelectorAll('item'))
        .then((items) => {
        // eslint-disable-next-line array-callback-return
          Array.from(items).filter((item) => {
            const samePost = ru.translation.posts.filter((post) => post.link === item.querySelector('link').textContent);
            if (samePost.length === 0) return item;
          });
        })
        .then((newItems) => {
          if (newItems) {
            const id = watchedState.newPostsId;
            addPosts(id, newItems, 'updatedPosts');
            watchedState.form.state = 'updating';
          }
        });
    });
    setTimeout(addNewRssPosts, 5000);
  };

  setTimeout(addNewRssPosts, 5000);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    schema.validate({ url: input.value })
      .catch((error) => {
        watchedState.form.error = i18n.t(error.errors.join(''));
        watchedState.form.valid = false;
        throw new Error('invalidURL');
      })
      .then(() => ru.translation.fiedsURLs.filter((item) => item.url === input.value))
      .then((existingURLs) => {
        if (existingURLs.length === 0) {
          watchedState.form.error = '';
          watchedState.form.valid = true;
        } else {
          watchedState.form.error = i18n.t('form.errors.existingURL');
          watchedState.form.valid = false;
          throw new Error('URL already exists');
        }
      })
      .then(() => fetch(`https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(input.value)}`))
      .then((response) => {
        if (response.ok) return response.json();
        watchedState.form.error = i18n.t('form.errors.networkProblem');
        watchedState.form.valid = false;
        throw new Error('Network response was not ok.');
      })
      .then((data) => parseRSS(data.contents))
      .then((parsedRSS) => {
        if (parsedRSS.querySelectorAll('item').length === 0) {
          throw new Error('Invalid RSS');
        }
        const id = i;
        watchedState.actualId = i;

        addFeed(id, parsedRSS, input.value);
        const items = parsedRSS.querySelectorAll('item');
        addPosts(id, items, 'posts');
        i += 1;

        if (ru.translation.fiedsURLs.length === 1) {
          watchedState.form.state = 'initialization';
        } else {
          watchedState.form.state = 'adding';
        }
        watchedState.form.state = 'finished';
      })
      .catch(() => {
        watchedState.form.error = i18n.t('form.errors.invalidRSS');
        watchedState.form.valid = false;
        throw new Error('Invalid RSS');
      });
  });

  posts.addEventListener('click', (e) => render(e.target));
};