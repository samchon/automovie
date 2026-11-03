import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

type Vec3 = G.Vec3;

/**
 * The foot's own frame from its three dimensions: the one place a person's
 * foot length, foot breadth and lateral malleolus height enter, and the one
 * normalisation every other piece reads its landmarks in.
 *
 * Normalised foot coordinates (shared by every person): `a` along the foot
 * axis from the rearmost point of the heel, in foot lengths; `u` across it from
 * the forefoot's medial extreme (0) to its lateral extreme (1), in foot
 * breadths; heights over the floor in millimetres, given by the caller as a
 * share of the foot length or of the lateral malleolus height, whichever the
 * landmark's basis is. The ankle's centre stands at the origin of the plan
 * (ANSUR II's ankle place, `AutoMovieHumanFootPrior.PRIOR.ankle`), and the
 * foot axis is turned out of forward by the prior's yaw (reference median),
 * the left foot lateral toward +Z.
 */
export namespace AutoMovieHumanFootFrame {
  /** A foot's dimensions in calibration millimetres. */
  export interface IDimensions {
    /** Back of the heel to the tip of the longest toe. */
    length: number;

    /** Greatest breadth across the metatarsal heads. */
    breadth: number;

    /** Height of the lateral malleolus. */
    ankle: number;
  }

  /** A foot's frame: its scales and the map from normalised coordinates. */
  export interface IFrame {
    /** Foot length, mm. */
    L: number;

    /** Foot breadth, mm. */
    B: number;

    /** Lateral malleolus height, mm. */
    H: number;

    /** Ankle ring height, mm. */
    ring: number;

    /** World point of normalised foot coordinates `[a, u, y mm]`, left frame. */
    at: (a: number, u: number, y: number) => Vec3;

    /** The foot's lateral direction, left frame. */
    lateral: Vec3;
  }

  /**
   * A foot's frame.
   *
   * @param d Dimensions in calibration millimetres, all positive.
   */
  export function of(d: IDimensions): IFrame {
    if (!(d.length > 0) || !(d.breadth > 0) || !(d.ankle > 0))
      throw new Error("A foot needs positive dimensions");
    const prior: AutoMovieHumanFootPrior.IPrior = AutoMovieHumanFootPrior.PRIOR;
    const c: number = Math.cos(prior.yaw);
    const s: number = Math.sin(prior.yaw);

    // The plan point of the foot's own coordinates, turned out by the yaw
    // about the ankle's centre.
    const at = (a: number, u: number, y: number): Vec3 => {
      const along: number = (a - prior.ankle[0]) * d.length;
      const across: number = (u - prior.ankle[1]) * d.breadth;
      return [along * c - across * s, y, along * s + across * c];
    };

    return {
      L: d.length,
      B: d.breadth,
      H: d.ankle,
      ring: prior.ring * d.ankle,
      at,
      lateral: [-s, 0, c],
    };
  }
}
