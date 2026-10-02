/**
 * Measurements of one census zone against that body's own rest geometry.
 * Zone membership is a diagnostic classification of source vertices, not an
 * anatomical part boundary. The measurement owner fills this record and the
 * table formatter reads it; coordinates remain basis-frame metres.
 *
 * @author Samchon
 */
export interface IBodyPoseZoneDefects {
  /** Triangles whose first vertex lies in the zone and whose rest area is not degenerate. */
  triangles: number;

  /** Smallest and largest posed-over-rest triangle area, one when no triangle was measured. */
  minAreaRatio: number;
  maxAreaRatio: number;

  /** Counts below the shrink ratio and above the stretch ratio census cut-offs. */
  crushed: number;
  stretched: number;

  /** Largest dihedral-angle rise from rest, in degrees. */
  worstFold: number;

  /** One end of the worst fold's edge in posed basis metres, or null if none rises. */
  worstFoldAt: [number, number, number] | null;

  /** Edges whose dihedral angle rose past the fold census cut-off. */
  folds: number;
}
