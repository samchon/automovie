/**
 * Immutable common surface after subdivision and the anatomical field layers. The coordinator freezes detached position/topology/normal arrays for all providers in one build; normals describe this snapshot, not proposed output.
 *
 * @evidence contracts/common.md#principled-implementation Detached frozen XYZ rows, triangle/group IDs and area normals give independent providers the same post-layer basis before any proposal changes it.
 * @evidence contracts/common.md#clear-and-simple-design The snapshot supplies only common geometry needed by final position readers; proposal ownership and final normal rebuilding remain outside it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readonly types are backed by the coordinator's deep freeze, but immutable inputs do not certify provider anatomy or final surface embeddedness.
 * @evidence contracts/common.md#meaningful-documentation Members state millimetres, resident topology, material labels and normals valid only for the unmodified snapshot.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The readonly snapshot layout performs no copying, freezing or area-normal calculation; the coordinator owns those passes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The host record declares no cross-build snapshot cache or provider-result equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This interface allocates no snapshot buffers; the final-surface coordinator owns their per-call acquisition and release.
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
