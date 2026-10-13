/**
 * The tangent-space projection line of Three's normal-map chunk. Ordered
 * normal blends insert their slope changes immediately before this line.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Names the native tangent-normal boundary shared by declared normal blends.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Places slope composition before transformation into the shading frame.
 */
export const DETAIL_NORMAL_TARGET = "normal = normalize( tbn * mapN );";
