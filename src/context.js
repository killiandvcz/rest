import { Request } from "./request";

export class Context {
    /** @type {import("./request").Request} */
    #request;
    
    /** @type {import("./types.d").RestResponse} */
    #response;
    
    /** @type {Map<string, any>} */
    #state = new Map();

    /** @type {import("./rest").Rest} */
    #rest = null;
    
    
    /**
    * @param {import("./types.d").RestRequest} request - Requête HTTP originale
    * @param {import("./rest").Rest} rest - Instance de Rest
    */
    constructor(request, rest) {
        this.#request = new Request(request, this);
        this.#rest = rest;
    }
    
    /**
    * Définit une valeur dans le contexte de la requête
    * @param {string} key - Clé
    * @param {any} value - Valeur
    * @returns {RequestContext} - Pour chaînage
    */
    set(key, value) {
        this.#state.set(key, value);
        return this;
    }
    
    /**
    * Récupère une valeur du contexte de la requête
    * @param {string} key - Clé
    * @param {any} [defaultValue=null] - Valeur par défaut si non trouvée
    * @returns {any}
    */
    get(key, defaultValue = null) {
        return this.#state.has(key) ? this.#state.get(key) : defaultValue;
    }
    
    /**
    * Vérifie si une clé existe dans le contexte
    * @param {string} key - Clé à vérifier
    * @returns {boolean}
    */
    has(key) {
        return this.#state.has(key);
    }
    
    /**
    * Supprime une valeur du contexte
    * @param {string} key - Clé à supprimer
    * @returns {boolean} - True si la valeur existait et a été supprimée
    */
    delete(key) {
        return this.#state.delete(key);
    }
    
    
    /**
    * Crée une réponse JSON avec les données fournies
    * @param {any} data - Données à sérialiser en JSON
    * @param {ResponseInit?} [options] - Options de la réponse
    * @returns {Response}
    */
    json(data, options = {}) {
        this.#response = Response.json(data, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        return this.#response;
    }
    
    /**
    * Crée une réponse texte
    * @param {string} text - Texte de la réponse
    * @param {ResponseInit?} [options] - Options de la réponse
    * @returns {Response}
    */
    text(text, options = {}) {
        this.#response = new Response(text, {
            ...options,
            headers: {
                'Content-Type': 'text/plain',
                ...options.headers
            }
        });
        return this.#response;
    }
    
    
    /**
    * Not found response
    * @returns {Response}
    */
    notFound() {
        return new Response('Not Found', { status: 404 });
    }
    
    /**
    * Crée une redirection
    * @param {string} url - URL de redirection
    * @param {number?} [status=302] - Code de statut HTTP
    * @returns {Response}
    */
    redirect(url, status = 302) {
        this.#response = Response.redirect(url, status);
        return this.#response;
    }
    
    /**
    * Crée une réponse d'erreur
    * @param {string} message - Message d'erreur
    * @param {number} [status=500] - Code de statut HTTP
    * @param {Object} [details={}] - Détails supplémentaires
    * @param {ResponseInit?} [options] - Options de la réponse
    * @returns {Response}
    */
    error(message, status = 500, details = {}, options = {}) {
        this.#response = Response.json({
            error: {
                message,
                status,
                ...details
            }
        }, { 
            status,
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        return this.#response;
    }
    
    get request() {
        return this.#request;
    }
    
    get response() {
        return this.#response;
    }

    
    /**
     * @returns {import("./request").Request}
     */
    get service() {
        return this.#rest?.service || null;
    }
    
    
}