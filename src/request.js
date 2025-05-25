/**
* @typedef {import("./types.d").RestRequest} RestRequest
* @typedef {import("./types.d").RestResponse} RestResponse
*/

export class Request {
    
    /** @type {RestRequest} */
    #raw;
    
    /** @type {import('./context').Context} */
    #context;
    
    /** @type {URL} */
    get url() {
        return new URL(this.#raw.url);
    }
    
    /** @type {Record<string, string>} */
    get params() {
        return this.#raw.params;
    }
    
    /** @type {import('bun').CookieMap} */
    get cookies() {
        return this.#raw.cookies;
    }
    
    /**
    * @param {RestRequest} request - Requête HTTP originale
    * @param {import('./context').Context} context - Contexte de la requête
    */
    constructor(request, context) {
        this.#raw = request;
        
        this.#context = context;
    }
    
    /**
    * Accès à la requête HTTP originale
    * @returns {RestRequest}
    */
    get raw() {
        return this.#raw;
    }
    
    /**
    * Accès à la méthode HTTP
    * @returns {string}
    */
    get method() {
        return this.#raw.method;
    }
    
    
    /**
    * Accès au chemin de la requête
    * @returns {string}
    */
    get path() {
        return this.url.pathname;
    }
    
    /**
    * Accès aux headers
    * @returns {Headers}
    */
    get headers() {
        return this.#raw.headers;
    }
    
    /**
    * Accès à un header de la requête
    * @param {string} key - Clé du header
    * @returns {string|null} - Valeur du header
    */
    header = (key) => this.#raw.headers.get(key);
    
    
    /**
    * Accès à un paramètre de route
    * @param {string} key - Clé du paramètre
    * @returns {string|undefined} - Valeur du paramètre
    */
    param = (key) => this.params[key];
    
    /**
    * Accès à un paramètre de requête
    * @param {string} key - Clé du paramètre
    * @returns {string|null} - Valeur du paramètre
    */
    query = (key) => this.url.searchParams.get(key);
    
    /**
    * Accès à tous les paramètres de requête
    * @returns {URLSearchParams}
    */
    queries = () => this.url.searchParams;
    
    /**
    * Accès à tous les paramètres de requête sous forme d'objet
    * @returns {Promise<Any>}
    */
    json = async () => {
        try {
            return await this.#raw.json();
        } catch (err) {
            console.error(err);
            return null;
        }
    };
    
    
    /**
    * Récupère le corps de la requête sous forme de texte
    * @returns {Promise<string|null>}
    */
    text = async () => {
        try {
            return await this.#raw.text();
        } catch (err) {
            console.error(err);
            return null;
        }
        
    }
    
    /**
    * Récupère le corps de la requête sous forme de FormData
    * @returns {Promise<FormData|null>}
    */
    formData = async () => {
        try {
            
            return await this.#raw.formData();
        } catch (err) {
            console.error(err);
            return null;
        }
    }
    
    
    /**
    * Récupère le corps de la requête sous forme de ArrayBuffer
    * @returns {Promise<ArrayBuffer|null>}
    */
    arrayBuffer = async () => {
        try {
            return await this.#raw.arrayBuffer();
        } catch (err) {
            console.error(err);
            return null;
        }
    }
    
    
    /**
    * Récupère le corps de la requête sous forme de Blob
    * @returns {Promise<Blob|null>}
    */
    blob = async () => {
        try {
            return await this.#raw.blob();
        } catch (err) {
            console.error(err);
            return null;
        }
    }
    
    
    /**
    * @typedef {{string: (string|File|Blob|DataObject)}} DataObject
    */
    
    /**
    * @returns {Promise<object|string|null>}
    * @description Parse the request body based on the Content-Type header
    * @warn Only JSON, FormData, and text/plain are supported
    */
    parse = async () => {
        const contentType = this.headers.get("Content-Type")?.toLowerCase() || '';
        if (contentType) {
            if (contentType.includes("application/json")) {
                return await this.json();
            } else if (contentType.includes("application/x-www-form-urlencoded")) {
                const fd = await this.text();
                const data = new URLSearchParams(fd);
                const parsedData = {};
                for (const [key, value] of data.entries()) {
                    const sections = key.split(".");
                    let current = parsedData;
                    for (let i = 0; i < sections.length - 1; i++) {
                        if (!current[sections[i]]) {
                            current[sections[i]] = {};
                        }
                        current = current[sections[i]];
                    }
                    current[sections[sections.length - 1]] = value;
                }
                return parsedData;
            } else if (contentType.includes("multipart/form-data")) {
                const fd = await this.formData();
                let data = {};
                for (const [key, value] of fd.entries()) {
                    const sections = key.split(".");
                    let current = data;
                    for (let i = 0; i < sections.length - 1; i++) {
                        if (!current[sections[i]]) {
                            current[sections[i]] = {};
                        }
                        current = current[sections[i]];
                    }
                    current[sections[sections.length - 1]] = value;
                }
                return data;
            } else if (contentType.includes("text/plain")) {
                return await this.text();
            }
        }
        return null;
    }
}