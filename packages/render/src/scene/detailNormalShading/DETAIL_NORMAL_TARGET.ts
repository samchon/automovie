/**
 * The tangent-space projection line of Three's normal-map chunk. Ordered
 * normal blends insert their slope changes immediately before this line.
 */
export const DETAIL_NORMAL_TARGET = "normal = normalize( tbn * mapN );";
