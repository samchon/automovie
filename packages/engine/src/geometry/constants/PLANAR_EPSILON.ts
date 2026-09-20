/**
 * Largest cross product or distance a free-form ring may call zero.
 *
 * Three orders of magnitude below [FACE_EPSILON](./proceduralPolyhedron.ts), because a cross product
 * is an area and an arc drawn at millimetre resolution turns through one at
 * every corner: at 1e-9 a finely tessellated arch would read as a straight line
 * and lose every ear the triangulator needs.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Keeps the region kernel numerical tolerance explicit.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Sets the cross-product and segment-contact slack used by deterministic planar construction.
 */
export const PLANAR_EPSILON = 1e-12;
