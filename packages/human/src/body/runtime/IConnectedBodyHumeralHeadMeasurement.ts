import type { IAutoMovieHumanBodyHumeralHead } from "../../index";

/**
 * The preview's reading of one humeral head sphere against the shaped skin.
 *
 * Radius and distances are metres in the body frame. `centerInside` states
 * whether the sphere centre lies inside the skin, `nearestMetres` the distance
 * from that centre to the nearest skin point and `clearanceMetres` the signed
 * room the sphere has, negative when it protrudes.
 *
 * @author Samchon
 */
export interface IConnectedBodyHumeralHeadMeasurement {
  /** Humerus whose head was measured. */
  bone: IAutoMovieHumanBodyHumeralHead["bone"];

  /** Head sphere radius, in metres. */
  radiusMetres: number;

  /** Whether the sphere centre lies inside the skin. */
  centerInside: boolean;

  /** Distance from the centre to the nearest skin point, in metres. */
  nearestMetres: number;

  /** Nearest distance less the radius with the centre inside, else the negated nearest distance less the radius, in metres. */
  clearanceMetres: number;
}
