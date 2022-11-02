
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

  #get(key, deserializer){
    const rawStr = this.#store.get(key);
    return JSON.parse(rawStr, deserializer);
  }
  #set(key, value, serializer){
    const str = JSON.stringify(value, serializer);
    this.#store.set(key, str);
  }

  #getStore(key){
    //マイグレーションが必要なら実施
    if(this.#requireMigration(key)){
      this.#migrate(key);
    }
    const migration = this.#getCurrentMigration(key);
    return this.#get(Key.Store(key), migration.deserializer);
  }
  #setStore(key, value){
    const migration = this.#getCurrentMigration(key);
    this.#set(Key.Store(key), value, migration.serializer);
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

  #getCurrentMigration(key){
    const model = this.#getModel(key);
    const currentIndex = this.#getCurrentMigrationIndex(key);
    return model.migrations[currentIndex];
  }

  #requireMigration(key){
    //現在のMigration位置を取得
    const current = this.#getCurrentMigrationIndex(key);
    //未MigrationならMigrationが必要
    if(current === -1) return true;
    const model = this.#getModel(key);
    const migrations = model.migrations;
    //現在のMigration位置より後ろにMigrationがあるか
    return migrations.length > current+1;
  }

  #migrate(key) {
    const model = this.#getModel(key);
    const migrations = model.migrations;

    //実施する必要のあるmigrationを取得
    const current = this.#getCurrentMigrationIndex(key);
    const migrationList = migrations.slice(current + 1);

    const currentStoreValue = this.#getStore(key);
  
    //migrationを実施
    const migrated = migrationList.reduce((storeValue, m) => m.up(storeValue), currentStoreValue);
    this.#setStore(key, migrated);
    
    //一番最後のmigrationのバージョンを保存
    const lastMigration = migrationList.pop();
    this.#setVersion(key, lastMigration.v);
  }
}

export default Store;