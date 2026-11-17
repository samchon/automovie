/** Data and callback contracts shared by the LoftFrame operations. */
export namespace IAutoMovieLoftFrame {
  /**
   * Section origin and two axes; geometric rotation frames require an orthonormal pair.
   * The same shape also stores component derivatives in layer jet fields.
   *
   * @evidence contracts/development/design.md#principled-representation Three triples encode origin, planar x axis and planar z axis in world coordinates; geometric orthonormality is a caller premise, not a structural type guarantee.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The explicit basis record serves placement and interpolation without a hidden matrix convention.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This interface neither validates nor normalizes its axes; derivative-valued frame fields intentionally use the same shape without unit axes.
   * @evidence contracts/development/common.md#meaningful-documentation Gives origin units, geometric axis roles and the distinction between a rotation frame and its component derivatives.
   */
  export interface IFrame {
    /** World position of the section's planar origin, mm. */
    origin: [number, number, number];

    /** Unit in-plane axis carrying the harmonic x coordinate. */
    u: [number, number, number];

    /** Unit in-plane axis carrying the harmonic z coordinate, orthogonal to `u`. */
    v: [number, number, number];
  }
}
