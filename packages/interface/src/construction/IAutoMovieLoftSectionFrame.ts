/**
 * Section origin and two axes; geometric rotation frames require an orthonormal pair.
 * The same shape also stores component derivatives in layer jet fields.
 *
 * @evidence contracts/development/design.md#principled-representation Three triples encode origin, planar x axis and planar z axis in world coordinates; geometric orthonormality is a caller premise, not a structural type guarantee.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The explicit basis record serves placement and interpolation without a hidden matrix convention.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This interface neither validates nor normalizes its axes; derivative-valued frame fields intentionally use the same shape without unit axes.
 * @evidence contracts/development/common.md#meaningful-documentation Gives origin units, geometric axis roles and the distinction between a rotation frame and its component derivatives.
 */
export interface IAutoMovieLoftSectionFrame {
  /** World origin in mm for a frame value; its component derivatives use the containing jet's coordinate units. */
  origin: [number, number, number];

  /** In-plane x axis, unit for a geometric frame; a derivative record carries its unnormalized component derivative. */
  u: [number, number, number];

  /** In-plane z axis, orthogonal to u for a geometric frame; a derivative record carries its unnormalized component derivative. */
  v: [number, number, number];
}
