import type { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/**
 * The arm's sections for one side, in the left frame: a one-parameter family
 * of planes from the hand's branch (low parameter) through the heel, the
 * forearm and the upper arm to the level shoulder ring (high parameter). The
 * hand's solve reads its wrist, crease and girth; the chain reads its layers,
 * planes and points.
 */
export interface IAutoMovieHumanArmLaw {
  /** Hand origin, mm. */
  wrist: Vec3;

  /** Elbow centre, mm. */
  elbow: Vec3;

  /** Centre of the section at the wrist crease, mm. */
  crease: Vec3;

  /** Layer parameters from the bottom. */
  layers: number[];

  /** Normal of the section plane at a parameter, toward the shoulder. */
  normal(q: number): Vec3;

  /** A point the section plane passes through. */
  anchor(q: number): Vec3;

  /** Point of the section at a parameter and phase. */
  point(q: number, t: number): Vec3;

  /**
   * Hull perimeter of the forearm's tube cut by a plane through a point, mm;
   * the plane's normal faces the shoulder, as the tube's sections do.
   */
  girth(point: Vec3, normal: Vec3): number;
}
