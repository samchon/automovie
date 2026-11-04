import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadEyeOpening } from "./IAutoMovieHumanHeadEyeOpening";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The orbit as a relief window in the frame of one eye: the hollow from the
 * inner canthus to the fissure's centre, and the socket that falls further to
 * seat the globe a fixed depth behind the nasion's skin. Both are radial
 * heights, subtracted from the base surface; the window's centre is the
 * fissure's centre (its distance from the midline and the eye level) and its
 * lengths are written for a face height of {@link FACE_UNIT} and scaled with
 * the person's own.
 *
 * Reads: the landmark skeleton's eye level, face height and scale, the eye's
 * own opening (its place, length and seat), the prior's socket depth. Publishes
 * two depths, millimetres, that vanish with their value and slopes at the
 * window's edge (a Gaussian bell), so the window needs no seam.
 */
export namespace AutoMovieHumanHeadOrbit {
  /** What the orbit window reads. */
  export interface IInput {
    /** The landmark skeleton: eye level, face height and calibration scale. */
    plan: Pick<IAutoMovieHumanHeadLayout, "eye" | "faceHeight" | "scale">;

    /** The prior's face constants: the hollow's depth. */
    face: Pick<AutoMovieHumanHeadPrior.IFace, "socket">;

    /** This eye's opening: place, length and the seat's depth. */
    eye: Pick<IAutoMovieHumanHeadEyeOpening, "place" | "length" | "seat">;
  }

  /**
   * Depth of the orbit's hollow at a point.
   *
   * @param input What the window reads.
   * @param y Height of the point.
   * @param a Distance of the point from the midline, `|z|`.
   * @returns Depth in millimetres, positive inward.
   */
  export function socket(input: IInput, y: number, a: number): number {
    const unit: number = input.plan.faceHeight / FACE_UNIT;
    return (
      input.face.socket *
      input.plan.scale *
      AutoMovieHumanHeadMath.bell((y - input.plan.eye - unit) / (11.5 * unit)) *
      AutoMovieHumanHeadMath.bell(
        (a - input.eye.place + 0.2 * input.eye.length) / (12 * unit),
      )
    );
  }

  /**
   * Depth of the socket's seat for the globe at a point.
   *
   * @param input What the window reads.
   * @param y Height of the point.
   * @param a Distance of the point from the midline, `|z|`.
   * @returns Depth in millimetres, positive inward.
   */
  export function seat(input: IInput, y: number, a: number): number {
    const unit: number = input.plan.faceHeight / FACE_UNIT;
    return (
      input.eye.seat *
      AutoMovieHumanHeadMath.bell2(
        (y - input.plan.eye) / (11 * unit),
        (a - input.eye.place) / (15 * unit),
      )
    );
  }

  /**
   * Face height the window's lengths are written for, millimetres: the
   * specimen's, so that a face of another height scales them in proportion.
   */
  export const FACE_UNIT: number = 108;
}
