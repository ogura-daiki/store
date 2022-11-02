
const Key = Object.assign(Object.create(null), {
  Store:key=>`store-${key}`,
  Version:key=>`version-${key}`,
});

class Store {
  #store;
  #models;
  constructor(store, models){
    this.#store = store;
    this.#models = models;
  }

  #get(key, serializer){
    const rawStr = this.#store.get(key);
    return JSON.parse(rawStr, serializer);
  }
  #set(key, value){
    const str = JSON.stringify(value);
    this.#store.set(key, str);
  }

  #getStore(key){
    const model = this.#getModel(key);
    //保存されている内容を取得、マイグレーション
    const obj = this.#migrate(key, this.#getStore(key));
    this.#setStore(key, obj);
    return this.#get(Key.Store(key), model.serializer);
  }
  #setStore(key, value){
    this.#set(Key.Store(key), value);
  }

  #getVersion(key){
    return this.#get(Key.Version(key));
  }
  #setVersion(key, value){
    this.#set(Key.Version(key), value);
  }
  
  get(key){
    return this.#getStore(key);
  }
  set(key, value){
    this.#setStore(key, value);
  }

  #getModel(key){
    return this.#models[key];
  }

  #getCurrentMigrationIndex(key){
    const model = this.#getModel(key);
    const migrations = model.migrations;
    const currentVersion = this.#getVersion(key);
    if(typeof currentVersion !== "number") return -1;
    const currentMigrationIndex = migrations.findIndex(m=>m.v === currentVersion);
    if(currentMigrationIndex = -1){
      throw new Error(`migration missing. current:${version}`);
    }
    return currentMigrationIndex;
  }

  #migrate(key, obj) {
    const model = this.#getModel(key);
    const migrations = model.migrations;
    //実施する必要のあるmigrationを取得
    const current = this.#getCurrentMigrationIndex(key);
    const migrationList = migrations.slice(current + 1);
  
  
    //実施すべきmigrationが無い場合は最新の状態になっているのでそのまま返す。
    if (migrationList.length === 0) return obj;
  
    //migrationを実施
    const migrated = migrationList.reduce((obj, m) => m.up(obj), obj);
  
    //一番最後のmigrationのバージョンを保存
    const lastMigration = migrationList.pop();
    this.#setVersion(key, lastMigration.v);
    this.set(key, migrated);
  
    return migrated;
  }
}

export default Store;