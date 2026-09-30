/**
 * Immutable common surface after subdivision and the anatomical field layers.
 *
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
