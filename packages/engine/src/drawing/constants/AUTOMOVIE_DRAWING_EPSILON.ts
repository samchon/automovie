/**
 * Tolerance for deciding which side of the cut plane a vertex is on.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Prevents negligible floating-point drift around a section plane from changing which cut lines a drawing contains.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Sets the `1e-9` signed-distance tolerance used by plane classification and geometric degeneracy checks.
 */
export const AUTOMOVIE_DRAWING_EPSILON = 1e-9;
