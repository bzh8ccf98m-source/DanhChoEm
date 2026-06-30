const DB_NAME = 'DanhChoEmDB_v2';
const STORE_NAME = 'files';

export interface AppConfig {
  name: string;
  tagline: string;
  envFrom: string;
  letter: string;
  sig: string;
  reasons: string[];
  promises: string[];
  meter: string;
  meterLbl: string;
  surprise: string;
  password: string;
}

export interface SongItem {
  name: string;
  data: string; // Base64 Audio data URL
}

export const FALLBACK_CONFIG: AppConfig = {
  name: 'Em Yêu',
  tagline: 'Mỗi ngày bên em là một ngày anh thêm yêu cuộc sống này',
  envFrom: 'Em Yêu Của Anh',
  letter: 'Em ơi, mỗi ngày có em là mỗi ngày anh cảm thấy mình thật may mắn.\n\nNụ cười của em làm sáng cả ngày anh. Giọng cười ấy là âm thanh anh yêu nhất trên đời này.\n\nAnh yêu em không chỉ vì em xinh đẹp, mà vì trái tim em ấm áp và chân thật đến vậy. 🌸',
  sig: 'Anh ❤️',
  reasons: [
    'Nụ cười của em làm sáng cả ngày anh ☀️',
    'Trái tim em nhân hậu và ấm áp lắm 🌸',
    'Em luôn khiến anh muốn trở thành người tốt hơn 💪',
    'Giọng cười của em là âm thanh anh yêu nhất 🎶',
    'Em là nhà của anh, dù ở đâu 🏡'
  ],
  promises: [
    'Luôn ở bên em dù mưa hay nắng 🌦️',
    'Yêu em thêm mỗi ngày, mãi mãi 💗',
    'Nắm tay em đến khi tóc bạc 👴👵',
    'Làm em cười mỗi ngày 😊'
  ],
  meter: '∞%',
  meterLbl: 'Vô cực và vượt ra ngoài',
  surprise: 'Anh yêu em nhiều lắm! 💕\nCảm ơn em đã là người tuyệt vời nhất trong cuộc đời anh.\nEm là tất cả của anh. 🌹',
  password: '0102'
};

class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private isSupported: boolean = true;

  async init(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') {
        this.isSupported = false;
        resolve();
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => {
        console.warn('IndexedDB failed to open, using localStorage fallback');
        this.isSupported = false;
        resolve();
      };
      request.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve();
      };
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isSupported || !this.db) {
      const val = localStorage.getItem(key);
      if (!val) return null;
      try { return JSON.parse(val) as T; } catch { return null; }
    }
    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve((request.result as T) || null);
        request.onerror = () => {
          const val = localStorage.getItem(key);
          if (val) {
            try { resolve(JSON.parse(val) as T); } catch { resolve(null); }
          } else {
            resolve(null);
          }
        };
      } catch {
        const val = localStorage.getItem(key);
        if (val) {
          try { resolve(JSON.parse(val) as T); } catch { resolve(null); }
        } else {
          resolve(null);
        }
      }
    });
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    if (!this.isSupported || !this.db) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          // Fallback to localStorage
          try {
            localStorage.setItem(key, JSON.stringify(value));
            resolve(true);
          } catch {
            resolve(false);
          }
        };
      } catch {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          resolve(true);
        } catch {
          resolve(false);
        }
      }
    });
  }
}

export const dbStorage = new IndexedDBStorage();
