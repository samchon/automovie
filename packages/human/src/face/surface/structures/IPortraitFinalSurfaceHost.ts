/**
 * Immutable common surface after subdivision and the anatomical field layers.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Provides one immutable post-refinement skin basis for every component's final proposal.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Carries shared positions, triangle/material identities and area-weighted normals after the common anatomical layers.
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
