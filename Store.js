
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
    const model = this.#models[key];
    //保存されている内容を取得、マイグレーション
    const obj = this.#migrate(key, this.#getStore(key), model.migrations);
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

  #migrate(key, obj, migrations) {
    //現在のバージョンを取得
    const version = this.#getVersion(key);
    //実施する必要のあるmigrationを取得
    let current = -1;
    if (typeof version === "number") {
      current = migrations.findIndex(m => m.v === version);
      if (current === -1) throw new Error(`migration missing. current:${version}`);
    }
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