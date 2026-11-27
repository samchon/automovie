/**
 * Shortest-arc endpoint dot product above which quaternion interpolation uses
 * normalized linear interpolation. Sampler and component-extrema validation
 * share the boundary; equality uses SLERP.
 */
export const AutoMovieEngineQuaternionNlerpDotThreshold: number = 0.9995;
