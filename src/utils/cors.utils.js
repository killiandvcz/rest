/**
* @typedef {Object} CorsOptions
* @property {string|string[]|function} [origin="*"] - Allowed origins
* @property {string|string[]} [methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]] - Allowed methods
* @property {string|string[]} [allowedHeaders=["Content-Type", "Authorization"]] - Allowed headers
* @property {string|string[]} [exposedHeaders=[]] - Exposed headers
* @property {boolean} [credentials=false] - Allow credentials
* @property {number} [maxAge=86400] - Preflight cache time in seconds
* @property {boolean} [preflightContinue=false] - Pass control to next handler after preflight
* @property {number} [optionsSuccessStatus=204] - Status code for successful OPTIONS requests
* @property {boolean} [autoOptions=true] - Automatically handle OPTIONS requests
*/

/**
* Default CORS configuration
* @type {CorsOptions}
*/
const DEFAULT_OPTIONS = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: [],
    credentials: false,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    autoOptions: true
};

/**
* Check if origin is allowed
* @param {string} requestOrigin 
* @param {string|string[]|function} allowedOrigin 
* @returns {boolean|string}
*/
function isOriginAllowed(requestOrigin, allowedOrigin) {
    if (!requestOrigin) return false;
    
    if (typeof allowedOrigin === 'string') {
        if (allowedOrigin === '*') return '*';
        return allowedOrigin === requestOrigin ? requestOrigin : false;
    }
    
    if (Array.isArray(allowedOrigin)) {
        return allowedOrigin.includes(requestOrigin) ? requestOrigin : false;
    }
    
    if (typeof allowedOrigin === 'function') {
        return allowedOrigin(requestOrigin) ? requestOrigin : false;
    }
    
    return false;
}

/**
* Convert array or string to header value
* @param {string|string[]} value 
* @returns {string}
*/
function toHeaderValue(value) {
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    return value;
}

/**
* CORS middleware for Rest applications
* @param {import("../rest").Rest} rest - Rest instance
* @param {CorsOptions} [options={}] - CORS configuration options
*/
export const cors = (rest, options = {}) => {
    const config = { ...DEFAULT_OPTIONS, ...options };
    
    // Validate configuration
    if (config.maxAge < 0) {
        throw new Error('maxAge must be a non-negative number');
    }
    
    // Main CORS middleware
    rest.use('*', async (c, next) => {
        
        const requestOrigin = c.request.header('Origin');
        const requestMethod = c.request.method;
        
        // Check if origin is allowed
        const allowedOrigin = isOriginAllowed(requestOrigin, config.origin);
    
        
        // Set CORS headers if origin is allowed
        if (allowedOrigin) {
            // Set Access-Control-Allow-Origin
            if (allowedOrigin === '*' && !config.credentials) {
                c.response?.headers?.set?.('Access-Control-Allow-Origin', '*') || 
                c.set('__cors_origin', '*');
            } else {
                c.response?.headers?.set?.('Access-Control-Allow-Origin', allowedOrigin) || 
                c.set('__cors_origin', allowedOrigin);
            }
            
            // Set credentials if enabled
            if (config.credentials) {
                c.response?.headers?.set?.('Access-Control-Allow-Credentials', 'true') || 
                c.set('__cors_credentials', 'true');
                // config.exposedHeaders = [...config.exposedHeaders, 'Credentials'];
                // config.allowedHeaders = [...config.allowedHeaders, 'Credentials'];
            }
            
            // Set exposed headers
            if (config.exposedHeaders.length > 0) {
                const exposedHeadersValue = toHeaderValue(config.exposedHeaders);
                c.response?.headers?.set?.('Access-Control-Expose-Headers', exposedHeadersValue) || 
                c.set('__cors_expose_headers', exposedHeadersValue);
            }
        }

        
        
        // Handle preflight requests
        if (requestMethod === 'OPTIONS') {
            if (!allowedOrigin) {
                return c.error('CORS: Origin not allowed', 403);
            }
            
            const requestedMethod = c.request.header('Access-Control-Request-Method');
            const requestedHeaders = c.request.header('Access-Control-Request-Headers');
            
            // Check if method is allowed
            const allowedMethods = Array.isArray(config.methods) ? config.methods : [config.methods];
            if (requestedMethod && !allowedMethods.includes(requestedMethod)) {
                return c.error('CORS: Method not allowed', 405);
            }
            
            // Check if headers are allowed
            if (requestedHeaders) {
                const requestedHeadersList = requestedHeaders.split(',').map(h => h.trim());
                const allowedHeadersList = Array.isArray(config.allowedHeaders) ? 
                config.allowedHeaders : [config.allowedHeaders];
                
                const forbiddenHeaders = requestedHeadersList.filter(h => 
                    !allowedHeadersList.some(allowed => 
                        allowed.toLowerCase() === h.toLowerCase()
                    )
                );
                
                if (forbiddenHeaders.length > 0) {
                    return c.error(`CORS: Headers not allowed: ${forbiddenHeaders.join(', ')}`, 403);
                }
            }
            
            
            // Set preflight headers
            const response = new Response(null, { 
                status: config.optionsSuccessStatus,
                headers: {
                    'Access-Control-Allow-Origin': allowedOrigin,
                    'Access-Control-Allow-Methods': toHeaderValue(config.methods),
                    'Access-Control-Allow-Headers': toHeaderValue(config.allowedHeaders),
                    'Access-Control-Max-Age': config.maxAge.toString(),
                    ...(config.credentials && { 'Access-Control-Allow-Credentials': 'true' }),
                    ...(config.exposedHeaders.length > 0 && { 
                        'Access-Control-Expose-Headers': toHeaderValue(config.exposedHeaders) 
                    })
                }
            });
            
            if (config.preflightContinue) {
                // Store response and continue to next middleware
                c.set('__cors_preflight_response', response);
                await next(c).catch(err => {
                    console.error(`Error in CORS preflight continue for ${c.request.url}:`, err);
                    return c.error('CORS preflight continue failed', 500);
                });
                
                return c.response || c.json({
                    message: "CORS preflight request successful"
                }, { 
                    status: config.optionsSuccessStatus, 
                    headers: response.headers.toJSON()
                });
            } else {

                return c.json({
                    message: "CORS preflight request successful"
                }, { 
                    status: config.optionsSuccessStatus, 
                    headers: response.headers.toJSON() 
                });
            }
        }

        
        
        // Continue to next middleware for non-OPTIONS requests
        await next(c).catch(err => {
            console.error(`Error in CORS middleware for ${c.request.url}:`, err);
            
            if (!c.response) return c.error('CORS middleware failed', 500);
        })

        
        
        // Apply CORS headers to actual response if they were stored in context
        if (c.response) {
            const origin = c.get('__cors_origin');
            const credentials = c.get('__cors_credentials');
            const exposeHeaders = c.get('__cors_expose_headers');
            
            if (origin) c.response.headers.set('Access-Control-Allow-Origin', origin);
            if (credentials) c.response.headers.set('Access-Control-Allow-Credentials', credentials);
            if (exposeHeaders) c.response.headers.set('Access-Control-Expose-Headers', exposeHeaders);
        }
    });
    
    // Auto-register OPTIONS routes if enabled
    if (config.autoOptions) {
        rest.options('/*', async (c) => {
            // This should already be handled by the middleware above
            // but provides a fallback for edge cases
            return c.json({ message: "CORS preflight request successful" }, { status: config.optionsSuccessStatus });
        });
    }
};

/**
* Predefined CORS configurations
*/
export const corsPresets = {
    /**
    * Very permissive CORS - allows all origins, methods, and headers
    * ⚠️ Only use in development or for public APIs
    */
    permissive: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
        allowedHeaders: ["*"],
        credentials: false,
        maxAge: 86400
    },
    
    /**
    * Strict CORS - only allows specific origins and common headers
    * 🔒 Recommended for production
    */
    strict: {
        origin: [], // Must be configured
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
        maxAge: 3600
    },
    
    /**
    * API-focused CORS - designed for REST APIs
    * 📊 Good balance between security and functionality
    */
    api: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        exposedHeaders: ["X-Total-Count", "X-Page-Count"],
        credentials: false,
        maxAge: 7200
    },
    
    /**
    * SPA (Single Page Application) CORS
    * 🖥️ Optimized for frontend applications
    */
    spa: {
        origin: (origin) => {
            // Allow localhost and common development ports
            const allowedPatterns = [
                /^https?:\/\/localhost(:\d+)?$/,
                /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
                /^https?:\/\/\[::1\](:\d+)?$/
            ];
            return allowedPatterns.some(pattern => pattern.test(origin));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
        credentials: true,
        maxAge: 86400
    }
};

/**
* Quick CORS setup with presets
* @param {import("../rest").Rest} rest 
* @param {"permissive"|"strict"|"api"|"spa"} preset 
* @param {Partial<CorsOptions>} overrides 
*/
export const quickCors = (rest, preset = "api", overrides = {}) => {
    if (!corsPresets[preset]) {
        throw new Error(`Unknown CORS preset: ${preset}. Available: ${Object.keys(corsPresets).join(', ')}`);
    }
    
    const config = { ...corsPresets[preset], ...overrides };
    return cors(rest, config);
};

/**
* Development-only CORS (very permissive)
* ⚠️ DO NOT use in production
* @param {import("../rest").Rest} rest 
*/
export const devCors = (rest) => {
    if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️  devCors() should not be used in production!');
    }
    
    return cors(rest, corsPresets.permissive);
};