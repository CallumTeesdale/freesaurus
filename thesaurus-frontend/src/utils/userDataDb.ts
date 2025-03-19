import {Word} from "../types";

const DB_NAME = 'freesaurus-user-data';
const DB_VERSION = 1;

export interface WordCache {
    word: string;
    data: Word;
    cachedAt: string;
}

export interface RecentSearch {
    id?: number;
    word: string;
    timestamp: string;
}

export interface Favorite {
    word: string;
    addedAt: string;
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains('favorites')) {
                db.createObjectStore('favorites', {keyPath: 'word'});
            }

            if (!db.objectStoreNames.contains('recent-searches')) {
                db.createObjectStore('recent-searches', {
                    keyPath: 'id',
                    autoIncrement: true
                });
            }

            if (!db.objectStoreNames.contains('word-cache')) {
                db.createObjectStore('word-cache', {keyPath: 'word'});
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};
export const cacheWord = async (word: Word): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('word-cache', 'readwrite');
        const store = transaction.objectStore('word-cache');
        const wordCache: WordCache = {
            word: word.word,
            data: word,
            cachedAt: new Date().toISOString()
        };

        const request = store.put(wordCache);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
    });
};

export const getCachedWord = async (wordText: string): Promise<Word | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('word-cache', 'readonly');
        const store = transaction.objectStore('word-cache');
        const request = store.get(wordText);

        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result.data);
            } else {
                resolve(null);
            }
        };

        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
    });
};

export const addToFavorites = async (word: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('favorites', 'readwrite');
        const store = transaction.objectStore('favorites');
        const favorite: Favorite = {
            word,
            addedAt: new Date().toISOString()
        };

        const request = store.put(favorite);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
    });
};

export const removeFromFavorites = async (word: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('favorites', 'readwrite');
        const store = transaction.objectStore('favorites');
        const request = store.delete(word);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
    });
};

export const isFavorite = async (word: string): Promise<boolean> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('favorites', 'readonly');
        const store = transaction.objectStore('favorites');
        const request = store.get(word);

        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
    });
};

export const getAllFavorites = async (): Promise<string[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('favorites', 'readonly');
        const store = transaction.objectStore('favorites');
        const request = store.getAll();

        request.onsuccess = () => {
            const favorites = request.result || [];
            resolve(favorites.map(fav => fav.word));
        };

        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
    });
};

export const addToRecentSearches = async (word: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('recent-searches', 'readwrite');
        const store = transaction.objectStore('recent-searches');

        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
            const searches = getAllRequest.result || [];
            const existingIndex = searches.findIndex(s => s.word === word);

            if (existingIndex !== -1) {
                store.delete(searches[existingIndex].id as number);
            }
            const addRequest = store.add({
                word,
                timestamp: new Date().toISOString()
            });

            addRequest.onsuccess = () => {
                if (searches.length >= 20) {
                    searches.sort((a, b) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );

                    for (let i = 19; i < searches.length; i++) {
                        store.delete(searches[i].id as number);
                    }
                }

                resolve();
            };

            addRequest.onerror = () => reject(addRequest.error);
        };

        getAllRequest.onerror = () => reject(getAllRequest.error);
        transaction.oncomplete = () => db.close();
    });
};

export const getRecentSearches = async (): Promise<string[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('recent-searches', 'readonly');
        const store = transaction.objectStore('recent-searches');
        const request = store.getAll();

        request.onsuccess = () => {
            const searches = request.result || [];
            searches.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            resolve(searches.map(s => s.word));
        };

        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
    });
};

export const clearRecentSearches = async (): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('recent-searches', 'readwrite');
        const store = transaction.objectStore('recent-searches');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
    });
};