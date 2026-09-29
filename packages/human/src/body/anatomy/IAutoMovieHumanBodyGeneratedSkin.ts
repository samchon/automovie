/**
 * One connected exterior body skin generated from internal anatomy and pose.
 *
 * Positions and oriented triangles are outputs only, never document controls
 * or stored templates. Body skin may remain open at the existing neck/collar
 * interface while the face is owned elsewhere. A generator must validate
 * connectedness, orientation, nonintersection, the collar correspondence and
 * support against resolved internal tissues before render/export.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyGeneratedSkin {
  /** Flat XYZ metres in the common Y-up, Z-forward body frame. */
  readonly positionsMetres: readonly number[];
  /** Oriented triangle vertex ordinals of the single exterior component. */
  readonly triangles: readonly number[];
  /** Ordered vertex ordinals along the existing neck/collar seam. */
  readonly collarBoundary: readonly number[];
}
