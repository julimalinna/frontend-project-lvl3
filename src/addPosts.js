const addPostsToState = (id, data, postsName, watcher) => {
  const watchedState = watcher;

  data.forEach((item) => {
    if (!item.role) {
      watchedState[postsName].push({
        id,
        postId: watchedState.postsInfo.postId,
        title: item.title,
        description: item.description,
        url: item.url,
      });
      watchedState.postsInfo.postId += 1;
    }
  });
};
export default addPostsToState;
