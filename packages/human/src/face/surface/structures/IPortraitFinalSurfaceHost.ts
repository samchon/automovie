/**
 * Immutable common surface after subdivision and the anatomical field layers.
 *
 * @evidence contracts/common.md#principled-implementation The host is one immutable snapshot of positions, triangles, material groups and area-weighted normals of the refined surface, so every provider reads the same input.
 * @evidence contracts/common.md#clear-and-simple-design Four read-only fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitFinalSurfaceHost carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States immutability, the unit and that the normals describe the unmodified basis.
 * @evidence contracts/modeling.md#spatial-conventions Positions are construction millimetres; normals are unit vectors of the same frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitFinalSurfaceHost is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitFinalSurfaceHost carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitFinalSurfaceHost decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitFinalSurfaceHost constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitFinalSurfaceHost is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitFinalSurfaceHost carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitFinalSurfaceHost admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitFinalSurfaceHost defines no input through which a caller shapes a human form.
 * @author Samchon
 */
export interface IPortraitFinalSurfaceHost {
  /** Shared XYZ positions in construction millimetres. */
  positions: readonly (readonly number[])[];

  /** Resident oriented triangle indices, unchanged by a final surface proposal. */
  indices: readonly number[];

  /** One material-region identity per triangle, inherited through refinement. */
  groups: readonly number[];

  /** Common area-weighted normal directions on this unmodified input basis. */
  normals: readonly number[];
}
