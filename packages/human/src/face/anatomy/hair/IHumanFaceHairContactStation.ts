/**
 * Geometry-owned station of one actual emitted strand, in head-local metres.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContactStation {
  /** Actual mesh vertex ordinals belonging to this station, including its cap centre when present. */
  vertices: readonly number[];

  /** Actual emitted transverse radius; zero is the canonical attached root. */
  radius: number;

  /** Measured source curve distance from the root, in metres. */
  arcLength: number;
}
