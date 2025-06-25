/**
* @typedef {import("./route").Route} Route
* @typedef {import("./middleware").Middleware} Middleware
* @typedef {import("./types.d").RestPath} RestPath
* @typedef {import("./types.d").RestMethod} RestMethod
* @typedef {import("./types.d").RestRequest} RestRequest
*/

import { Context } from "./context";
import { Middleware } from "./middleware";
import { Route } from "./route";
import { printRoutes } from "./utils";

/**
* @typedef {{ app: Rest, path: String }} Mount
*/

export class Rest {
    /** @type {Route[]} */
    #routes = [];
    
    /** @type {Middleware[]} */
    #middlewares = [];
    
    /** @type {Mount[]} */
    #mounts = [];
    
    /** @type {import("../service").Service} */
    #service = null;
    
    /**
    * @param {Route} route 
    */
    #addRoute(route) {
        const existingRoute = this.#routes.find(r => r.method === route.method && r.path === route.path);
        if (existingRoute) {
            throw new Error(`Route already exists: ${route.method} ${route.path}`);
        }
        // Add the route to the list of routes<
        this.#routes.push(route);
    }
    
    /**
    * @param {import("./types.d").RestPath} path
    * @param {import("./types.d").RestHandler} handler
    * @returns {Rest}
    */
    get(path, handler) {
        const route = new Route("GET", path, handler, this);
        this.#addRoute(route);
        return this;
    }
    
    /**
    * @param {import("./types.d").RestPath} path
    * @param {import("./types.d").RestHandler} handler
    * @returns {Rest}
    */
    post(path, handler) {
        const route = new Route("POST", path, handler, this);
        this.#addRoute(route);
        return this;
    }
    
    /**
    * @param {import("./types.d").RestPath} path
    * @param {import("./types.d").RestHandler} handler
    * @returns {Rest}
    */
    put(path, handler) {
        const route = new Route("PUT", path, handler, this);
        this.#addRoute(route);
        return this;
    }
    
    /**
    * @param {import("./types.d").RestPath} path
    * @param {import("./types.d").RestHandler} handler
    * @returns {Rest}
    */
    delete(path, handler) {
        const route = new Route("DELETE", path, handler, this);
        this.#addRoute(route);
        return this;
    }
    
    /**
    * @param {import("./types.d").RestPath} path
    * @param {import("./types.d").RestHandler} handler
    * @returns {Rest}
    */
    patch(path, handler) {
        const route = new Route("PATCH", path, handler, this);
        this.#addRoute(route);
        return this;
    }

    /**
    * @param {import("./types.d").RestPath} path
    * @param {import("./types.d").RestHandler} handler
    * @returns {Rest}
    */
    options(path, handler) {
        const route = new Route("OPTIONS", path, handler, this);
        this.#addRoute(route);
        return this;
    }
    
    /**
    * @param {RestPath|RestPath[]} paths
    * @param {import("./types.d").MiddlewareHandler} handler 
    * @returns {Rest}
    */
    use(paths, handler) {
        if (!Array.isArray(paths)) {
            paths = [paths];
        }
        paths.forEach(path => {
            if (typeof path !== "string") {
                throw new Error(`Invalid path: ${path}`);
            }
            
            const middleware = new Middleware(path, handler);
            this.#middlewares.push(middleware);
        });
        return this;
    }
    
    
    /**
    * @param {string} path 
    * @param {Rest} app 
    */
    mount(path, app) {
        if (!(app instanceof Rest)) {
            throw new Error("The mounted application must be an instance of Rest");
        }
        const mounted = {
            app,
            path
        }
        this.#mounts.push(mounted);
    }
    
    /**
    * @protected
    * @private
    * @returns {Array<{
    *  method: string,
    *  path: string,
    * route: Route,
    * }>}
    */
    getRoutes(upperPrefix = "") {
        /**
        * @param {string} prefix
        * @param {Route} r
        */
        const route = (prefix = "", r) => {
            const path = `${prefix}${r.path}`.replace(/\/\//g, "/").replace(/\/$/, "");
            return {
                route: r,
                path,
                method: r.method.toUpperCase()
            };
        }
        
        const routes = [...this.#routes.map(r => route(this.basepath, r)), ...this.#mounts.map(m => {
            const prefix = m.path === "/" ? "" : m.path;
            
            // Modifié ici - au lieu d'appeler route() sur r.route, on travaille directement avec les chemins
            const rs = m.app.getRoutes().map(r => ({
                route: r.route,
                path: `${prefix}${r.path}`.replace(/\/\//g, "/").replace(/\/$/, ""),
                method: r.method
            }));
            return rs;
        })].flat();
        return routes;
        
    }
    
    
    /**
    * @protected
    * @private
    * @returns {Array<{
    *  middleware: Middleware,
    *  order: number,
    *  path: string,
    * }>}
    */
    get middlewares() {
        // Fonction helper pour normaliser les chemins
        const normalizePath = (path) => path.replace(/\/\//g, "/").replace(/\/$/, "") || "/";
        
        // Création d'un nouveau tableau pour les middlewares de l'application courante
        const currentMiddlewares = this.#middlewares.map((m, index) => ({
            middleware: m,
            path: normalizePath(`${this.basepath || ""}${m.path}`),
            order: index // Utilise l'index réel dans le tableau original
        }));
        
        // Aplatissement et traitement des middlewares des sous-applications montées
        const mountedMiddlewares = this.#mounts.flatMap(mount => {
            const prefix = mount.path === "/" ? "" : mount.path;
            
            // Ce code est similaire au problème trouvé dans getRoutes()
            // Il faut travailler directement avec les chemins déjà traités
            return mount.app.middlewares.map(m => ({
                middleware: m.middleware,
                // Utilisez le chemin déjà traité par l'app montée et ajoutez le préfixe actuel
                path: normalizePath(`${prefix}${m.path}`),
                order: currentMiddlewares.length + m.order 
            }));
        });
        
        // Combinaison et retour des deux ensembles
        return [...currentMiddlewares, ...mountedMiddlewares];
    }
    
    /**
    * @param {String} path 
    * @returns {Array<Middleware>}
    * @private
    */
    #middlewaresOf = (path) => {
        
        const matchedMiddlewares = this.middlewares.filter(m => {
            // Cas 1: Wildcard global
            if (m.path === "*") return true;
            
            // Transformer le chemin de middleware en regex en gérant plusieurs cas spéciaux
            let regexPattern = m.path
            // Échapper les caractères spéciaux de regex, sauf ceux qu'on va traiter spécifiquement
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            // Remplacer les wildcards explicites * par .+
            .replace(/\\\*/g, '.+')
            // Remplacer les paramètres :param par des groupes de capture
            .replace(/:([\w]+)/g, '([^/]+)');
            
            // Cas 2: Correspondance exacte (avec ou sans paramètres/wildcards)
            const exactRegex = new RegExp("^" + regexPattern + "$");
            if (exactRegex.test(path)) return true;
            
            // Cas 3: Préfixe de chemin (pour les middlewares montés)
            const prefixRegex = new RegExp("^" + regexPattern + "(/.*)?$");
            return prefixRegex.test(path);
            
        }).sort((a, b) => {
            // 1. Wildcard global a la priorité la plus basse
            if (a.path === "*") return 1;
            if (b.path === "*") return -1;
            
            // 2. Nombre de wildcards (moins = plus spécifique)
            const aWildcards = (a.path.match(/\*/g) || []).length;
            const bWildcards = (b.path.match(/\*/g) || []).length;
            if (aWildcards !== bWildcards) {
                return aWildcards - bWildcards;
            }
            
            // 3. Nombre de paramètres (moins = plus spécifique)
            const aParams = (a.path.match(/:[^/]+/g) || []).length;
            const bParams = (b.path.match(/:[^/]+/g) || []).length;
            if (aParams !== bParams) {
                return aParams - bParams;
            }
            
            // 4. Longueur du chemin (plus long = plus spécifique)
            const aSegments = a.path.split("/").length;
            const bSegments = b.path.split("/").length;
            if (aSegments !== bSegments) {
                return bSegments - aSegments;
            }
            
            // 5. Longueur absolue de la chaîne (plus long = plus spécifique)
            if (a.path.length !== b.path.length) {
                return b.path.length - a.path.length;
            }
            
            // 6. En dernier recours, utiliser l'ordre de création
            // Suppose que chaque middleware a une propriété 'order'
            return a.order - b.order;
        });
        
        
        
        return matchedMiddlewares;
    }
    
    
    /**
    * @param {import("../service").Service} service
    */
    get service() {
        if (!this.#service) {
            throw new Error("Service not set");
        }
        return this.#service;
    }
    
    /**
    * @param {import("../service").Service} service
    */
    set service(service) {
        if (this.#service) {
            throw new Error("Service already set");
        }
        this.#service = service;
    }
    
    
    /**
    * @returns {import("./types.d").RestRoutes}
    */
    get routes() {
        /** @type {import("./types.d").RestRoutes} */
        const routes = {};
        
        this.getRoutes().forEach(route => {
            routes[route.path] ??= {};
            
            const middlewares = this.#middlewaresOf(route.path) || [];
            /** @type {(import("./types.d").RestHandler|import("./types.d").MiddlewareHandler)[]} */
            
            const handlers = [...middlewares.map(m => m.middleware.handler)].reverse();
            
            let next = route.route.handler;
            
            // Parcourir les middlewares en sens inverse pour construire la chaîne
            for (let i = handlers.length - 1; i >= 0; i--) {
                const handler = handlers[i];
                const currentNext = next;
                next = async (context) => {
                    return await Promise.resolve(handler(context, currentNext));
                };
            }
            
            routes[route.path][route.method] = async request => {
                const context = new Context(request, this);
                try {
                    await Promise.resolve(next(context));
                    // console.log(context.response);
                    
                    if (context.response) {
                        return context.response;
                    } else {
                        throw new Error("No response set in context");
                    }
                } catch (error) {
                    console.error("Route handler error:", error);
                    
                    // Si une erreur est déjà définie dans le contexte, utilise-la
                    if (context.response) {
                        return context.response;
                    }
                    
                    // Sinon, crée une réponse 500 par défaut
                    return new Response(
                        JSON.stringify({ 
                            error: "Internal Server Error", 
                            message: error.message 
                        }),
                        { 
                            status: 500, 
                            headers: { "Content-Type": "application/json" } 
                        }
                    );
                }
            };
        });
        
        return routes;
    }
    
    
    get fetch() {
        /**
        * @param {Request} request
        * @param {import("bun").Server} server
        */
        return async (request, server) => {
            return new Response("Not found", { status: 404 });
        }
    }
    
    
    showRoutes = () => printRoutes(this);
}