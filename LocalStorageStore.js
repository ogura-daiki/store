import Store from "./Store.js";

const store = {
  get(key, receiver = ((n, v) => v)) {
    return JSON.parse(localStorage.getItem(key) || "{}", receiver);
  },
  set(key, value) {
    return localStorage.setItem(key, JSON.stringify(value));
  },
};


class LocalStorageStore extends Store{
  constructor(models){
    super(store, models);
  }
}

export default LocalStorageStore;