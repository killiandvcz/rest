/**
* @typedef {import("./types.d").RestPath} RestPath
* @typedef {import("./types.d").RestMethod} RestMethod
* @typedef {import("./types.d").RestRequest} RestRequest
* @typedef {import("./types.d").RestResponse} RestResponse
* @typedef {import("./types.d").RestHandler} RestHandler
* @typedef {import("./rest").Rest} Rest
*/

export class Route {
    
    /** @type {RestMethod} */
    #method;
    
    /** @type {RestPath} */
    #path;
    
    /** @type {RestHandler} */
    #handler;
    
    
    /**
    * @param {RestMethod} method - Méthode HTTP
    * @param {RestPath} path - Chemin de la route
    * @param {RestHandler} handler - Gestionnaire de la route
    */
    constructor(method, path, handler) {
        this.#method = method;
        this.#path = path;
        // Vérification de la méthode
        if (!["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"].includes(method)) {
            throw new Error(`Invalid HTTP method: ${method}`);
        }
        // Vérification du chemin
        if (!path || typeof path !== "string") {
            throw new Error(`Invalid path: ${path}`);
        }
        // Vérification du gestionnaire
        if (typeof handler !== "function") {
            throw new Error(`Invalid handler: ${handler}`);
        }
        this.#handler = handler;
    }
    
    /**
    * Accès au chemin de la route
    * @returns {RestPath}
    */
    get path() {
        return this.#path;
    }
    
    
    /**
    * Accès à la méthode HTTP de la route
    * @returns {RestMethod}
    */
    get method() {
        return this.#method;
    }

    /**
     * @returns {RestHandler}
     */
    get handler() {
        return async (context) => await Promise.resolve(this.#handler(context));
    }
}