/**
* @typedef {string} RestPath
* @typedef {"GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD"} RestMethod
* @typedef {import("bun").BunRequest} RestRequest
* @typedef {Response} RestResponse
*/

/**
* @typedef {import('./context').Context} Context
*/

/**
* @typedef {(context: Context) => Promise<RestResponse|Context>} RestHandler
* @typedef {(context: Context, next: RestHandler|MiddlewareHandler) => Promise<RestResponse|Context>} MiddlewareHandler
*/


/**
 * @typedef {((req: RestRequest) => RestResponse)} RestHandlerFunction
 * @typedef {Object<RestMethod, RestHandlerFunction>} RestRoute
 */

/**
 * @typedef {Object<string, RestRoute>} RestRoutes
 */


export {}