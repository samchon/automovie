/**
 * One performed cell's area vector (square metres, Y up, +Z forward) and the
 * flat offset of its parent triangle's slot in the parent area array.
 *
 * @evidence contracts/common.md#principled-implementation Each performed cell must agree in direction with its complete parent, so its own vector is kept beside the parent slot.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Vectors come from actual performed cells.
 * @evidence contracts/common.md#meaningful-documentation States both fields, units and frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A cell area defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A cell area emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Square metres in the shared Y-up, +Z-forward frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Internal bookkeeping of one admission; it builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal bookkeeping that is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical geometry, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Evaluated geometry, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCellArea {
  /** Flat offset of the parent triangle's area-vector slot. */
  parent: number;

  /** The cell's area vector, square metres. */
  vector: number[];
}
