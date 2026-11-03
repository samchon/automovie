import { AutoMovieHumanSeamCarve } from "../lofting/AutoMovieHumanSeamCarve";
import { AutoMovieHumanSeamUnion } from "../lofting/AutoMovieHumanSeamUnion";
import { AutoMovieHumanHeadJawJoint } from "./AutoMovieHumanHeadJawJoint";
import { AutoMovieHumanHeadLipFrame } from "./AutoMovieHumanHeadLipFrame";
import { AutoMovieHumanHeadLowerLip } from "./AutoMovieHumanHeadLowerLip";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadNose } from "./AutoMovieHumanHeadNose";
import { AutoMovieHumanHeadNoseCrease } from "./AutoMovieHumanHeadNoseCrease";
import { AutoMovieHumanHeadNoseFrame } from "./AutoMovieHumanHeadNoseFrame";
import { AutoMovieHumanHeadOralGroove } from "./AutoMovieHumanHeadOralGroove";
import { AutoMovieHumanHeadOrbit } from "./AutoMovieHumanHeadOrbit";
import { AutoMovieHumanHeadPhiltrum } from "./AutoMovieHumanHeadPhiltrum";
import type { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadUpperLip } from "./AutoMovieHumanHeadUpperLip";
import type { IAutoMovieHumanHeadEyeOpening } from "./IAutoMovieHumanHeadEyeOpening";
import type { IAutoMovieHumanHeadSurface } from "./IAutoMovieHumanHeadSurface";

/**
 * The head's named features merged onto the base surface: the additive
 * pieces (the jaw joint, the nose, the lips) by `AutoMovieHumanSeamUnion.bump`,
 * then the subtractive pieces (the orbit's hollow and the socket that seats
 * the eye, the alar crease, the philtrum, the oral groove) by
 * `AutoMovieHumanSeamCarve.dent`. Each feature is a window of its own file in
 * its own frame (the eye's, the nose's, the lips'), read at the base point
 * the ray reaches; this namespace only gathers each level's heights and
 * merges them in the order of the construction levels (base, then additive,
 * then subtractive), faded in over the face.
 */
export namespace AutoMovieHumanHeadRelief {
  /** The features' heights at a base point, millimetres, both at least zero. */
  export interface IHeights {
    /** Sum of the additive pieces' heights over the base. */
    raised: number;

    /** Sum of the subtractive pieces' depths under the base. */
    carved: number;
  }

  /**
   * The additive and subtractive heights of the named features at a point of
   * the base surface, each held to nothing behind the ears by a smoothstep
   * that starts 25 mm behind the skull's centre and takes 30 mm.
   *
   * @param surface The person's surface: plan, prior and compiled splines.
   * @param x Forward place of the point on the base surface.
   * @param y Height of the point.
   * @param z Lateral place of the point.
   * @param sign Side of the point, 1 left and -1 right; each side reads its own eye.
   * @returns The two sums in millimetres.
   */
  export function heights(
    surface: IAutoMovieHumanHeadSurface,
    x: number,
    y: number,
    z: number,
    sign: 1 | -1,
  ): IHeights {
    const { plan, compiled } = surface;
    const f: AutoMovieHumanHeadPrior.IFace = compiled.prior.face;
    const k: number = plan.scale;
    if (x < plan.centre - 25 * k) return { raised: 0, carved: 0 };
    const front: number = AutoMovieHumanHeadMath.smooth((x - plan.centre + 25 * k) / (30 * k));
    const a: number = Math.abs(z);
    const eye: IAutoMovieHumanHeadEyeOpening = sign > 0 ? plan.left : plan.right;
    const orbit: AutoMovieHumanHeadOrbit.IInput = { plan, face: f, eye };
    const nose: AutoMovieHumanHeadNoseFrame.IFrame = AutoMovieHumanHeadNoseFrame.at(plan, f, y);
    const lips: AutoMovieHumanHeadLipFrame.IFrame | null = AutoMovieHumanHeadLipFrame.at(plan, a);

    // Additive: the jaw joint ahead of the ear, the nose, the lips over their borders.
    const raised: number =
      AutoMovieHumanHeadJawJoint.height({ plan, base: compiled.prior.frame.base }, y, a) +
      AutoMovieHumanHeadNose.height({ plan, face: f, compiled }, y, a) +
      (lips !== null
        ? AutoMovieHumanHeadUpperLip.bulge(plan, lips, y) + AutoMovieHumanHeadLowerLip.bulge(plan, lips, y)
        : 0);

    // Subtractive: the orbit's hollow and the socket falling to the eye's
    // seat, the alar crease that sets each lobule back into the cheek, the
    // philtrum, and the fissure between the lips.
    const carved: number =
      AutoMovieHumanHeadOrbit.socket(orbit, y, a) +
      AutoMovieHumanHeadOrbit.seat(orbit, y, a) +
      AutoMovieHumanHeadNoseCrease.depth(nose, f, k, y, a) +
      AutoMovieHumanHeadPhiltrum.depth(plan, f, y, a) +
      (lips !== null ? AutoMovieHumanHeadOralGroove.depth(plan, f, lips, y) : 0);
    return { raised: raised * front, carved: carved * front };
  }

  /**
   * The skin's radial distance along a ray: the base's, raised by the
   * additive pieces and then carved by the subtractive ones. The operators
   * refuse a piece of the wrong sign, so a piece that would carve by adding,
   * or add by carving, is named where it breaks the merge.
   *
   * @param surface The person's surface.
   * @param base The base outline's radial distance along the ray, mm.
   * @param x Forward place of the base point.
   * @param y Height of the base point.
   * @param z Lateral place of the base point.
   * @param sign Side of the point.
   * @returns The merged radial distance, mm.
   */
  export function merged(
    surface: IAutoMovieHumanHeadSurface,
    base: number,
    x: number,
    y: number,
    z: number,
    sign: 1 | -1,
  ): number {
    const h: IHeights = heights(surface, x, y, z, sign);
    return AutoMovieHumanSeamCarve.dent(AutoMovieHumanSeamUnion.bump(base, h.raised), -h.carved);
  }
}
