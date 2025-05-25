/**
 * @typedef {import('./types.d').RestResponse} RestResponse
 * @typedef {import('./types.d').RestPath} RestPath
 * @typedef {import('./types.d').MiddlewareHandler} MiddlewareHandler
 * @typedef {import('./context').Context} Context
 */

export class Middleware {
    /** @type {RestPath} */
    #path;

    /** @type {MiddlewareHandler} */
    #handler;


    /**
     * @param {RestPath} path
     * @param {MiddlewareHandler} handler
     */
    constructor(path, handler) {
        this.#path = path;
        this.#handler = handler;
    }

    // /**
    //  * @param {Context} context 
    //  * @returns {Promise<Context>}
    //  */
    // handler = async (context) => {
    //     return await Promise.resolve(this.#handler(context));
    // }

    /**
     * @returns {MiddlewareHandler}
     */
    get handler() {
        return async (context, next) => await Promise.resolve(this.#handler(context, next));
    }


    /**
     * @returns {RestPath}
     */
    get path() {
        return this.#path;
    }

}