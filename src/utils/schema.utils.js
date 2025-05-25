import {z, ZodAny} from 'zod';

/**
* @callback SchemaCallback
* @param {import('zod').z} schema - Zod instance
* @returns {import('zod').ZodAny} - Zod type
*/

/**
* @typedef {Object} SchemaOptions
* @property {boolean} [strict=false] - Whether to use strict mode.
* @property {Object} [crossData={}] - Manually added data to the schema.
* @property {boolean} [redact=false] - Whether to redact the data in the error message. 
*/

/**
* @param {import('@/rest/context').Context} c 
* @param {SchemaCallback | ZodAny} schema
* @param {SchemaOptions} [options={}] - Options for the schema.
*/
export const schema = async (c, schema, options = {}) => {
    options = {
        strict: false,
        crossData: {},
        
        ...options,
    };

    
    
    const data = {
        ...((c.request.method.toLowerCase !== "get" && await c.request.parse()) || {}),
        ...(options.crossData || {}), 
    }

    if (!data) {
        throw c.error("Invalid request data", 400);
    }
    
    const parsedData = (await Promise.resolve(schema(z))).safeParse({...data});
    
    if (!parsedData.success) {
        if (options.redact) {
            throw c.error("Invalid request data", 400);
        } else {
            const issues = parsedData.error.issues
            throw c.error("Invalid request data", 400, {
                issues
            });
        }
    }

    c.set("data", parsedData.data);

    return parsedData.data;
}

export const s = z;

/**
 * @param {SchemaCallback} schema
 */
export const createSchema = (schema) => schema(z);