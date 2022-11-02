import Store from "./Store.js";

const store = {
  get(key) {
    return localStorage.getItem(key);
  },
  set(key, value) {
    return localStorage.setItem(key, value);
  },
};


class LocalStorageStore extends Store{
  constructor(models){
    super(store, models);
  }
}

export default LocalStorageStore;