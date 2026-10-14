/**
 * Largest cross product or distance a free-form ring may call zero.
 *
 * Three orders of magnitude below [FACE_EPSILON](./proceduralPolyhedron.ts), because a cross product
 * is an area and an arc drawn at millimetre resolution turns through one at
 * every corner: at 1e-9 a finely tessellated arch would read as a straight line
 * and lose every ear the triangulator needs.
 */
export const PLANAR_EPSILON = 1e-12;
