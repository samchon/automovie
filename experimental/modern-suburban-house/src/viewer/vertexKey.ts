
/** Key of a coordinate tuple, each component rounded to a nanometre. */
export const vertexKey = (p: readonly number[]): string => p.map((n) => String(Math.round(n * 1e9) / 1e9)).join(",");
