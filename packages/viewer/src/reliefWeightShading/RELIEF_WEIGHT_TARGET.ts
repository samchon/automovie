/**
 * The native normal-map slope scale line, after which per-vertex relief applies.
 * Detail blends remain downstream of this boundary and retain their own scale.
 */
export const RELIEF_WEIGHT_TARGET = "mapN.xy *= normalScale;";
