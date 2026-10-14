

/**
 * Allocate the twelve zero bytes required by one FLOAT VEC3 position.
 */
export const basePayload: () => Buffer = (): Buffer => Buffer.alloc(12);
