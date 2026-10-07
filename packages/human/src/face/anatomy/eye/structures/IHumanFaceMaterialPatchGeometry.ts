/** Current host geometry of one source-owned clipped material patch.
 * Head-frame metres and unit host-normal directions share one point table.
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
