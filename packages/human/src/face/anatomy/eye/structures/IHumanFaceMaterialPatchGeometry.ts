/** Current host geometry of one source-owned clipped material patch.
 * Head-frame metres and unit host-normal directions share one point table.
 *
 * @evidence contracts/common.md#principled-implementation Live host-affine positions and unit compatible normals share the retained patch point incidence.
 * @evidence contracts/common.md#clear-and-simple-design evaluateHumanFaceMaterialPatch owns current source-host evaluation and medial-bed construction consumes it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No newly fitted plane, projection or smoothed geometry replaces registered source support.
 * @evidence contracts/common.md#meaningful-documentation Fields state head-frame metres, unit directions and oriented patch triangles.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceMaterialPatchGeometry is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceMaterialPatchGeometry declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceMaterialPatchGeometry itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceMaterialPatchGeometry {
  /** Flat live XYZ positions in patch-point order. */
  positions: number[];

  /** Flat unit normal directions interpolated from the same skin owner. */
  normals: number[];

  /** Oriented patch-point triangle incidence. */
  indices: number[];
}
