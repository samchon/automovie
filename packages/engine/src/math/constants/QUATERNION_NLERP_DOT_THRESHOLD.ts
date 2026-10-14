/**
 * Shortest-arc endpoint dot product above which quaternion interpolation uses normalized linear interpolation. Sampler and component-extrema validation share the boundary; equality uses SLERP.
 */
export const QUATERNION_NLERP_DOT_THRESHOLD: number = 0.9995;
