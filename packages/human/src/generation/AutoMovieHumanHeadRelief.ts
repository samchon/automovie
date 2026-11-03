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
 * The head's named features composed into one radial height over the base
 * surface: the orbit's hollow and the socket that seats the eye, the jaw
 * joint, the nose with its alar crease, the philtrum and the lips with the
 * fissure between them. Each feature is a window of its own file in its own
 * frame (the eye's, the nose's, the lips'); this namespace only adds their
 * heights, in a fixed order, and fades them in over the face.
 */
export namespace AutoMovieHumanHeadRelief {
  /**
   * Radial height of the named features at a point of the base surface.
   *
   * The windows add in the order the face's features were first drawn (orbit,
   * joint, nose, crease, philtrum, lips, fissure); the sum is in millimetres,
   * positive outward, and is held to nothing behind the ears by a smoothstep
   * that starts 25 mm behind the skull's centre and takes 30 mm.
   *
   * @param surface The person's surface: plan, prior and compiled splines.
   * @param x Forward place of the point on the base surface.
   * @param y Height of the point.
   * @param z Lateral place of the point.
   * @param sign Side of the point, 1 left and -1 right; each side reads its own eye.
   * @returns Height in millimetres.
   */
  export function relief(
    surface: IAutoMovieHumanHeadSurface,
    x: number,
    y: number,
    z: number,
    sign: 1 | -1,
  ): number {
    const { plan, compiled } = surface;
    const f: AutoMovieHumanHeadPrior.IFace = compiled.prior.face;
    const k: number = plan.scale;
    if (x < plan.centre - 25 * k) return 0;
    const front: number = AutoMovieHumanHeadMath.smooth((x - plan.centre + 25 * k) / (30 * k));
    const a: number = Math.abs(z);
    const eye: IAutoMovieHumanHeadEyeOpening = sign > 0 ? plan.left : plan.right;

    // The orbit: the hollow, then the socket falling to the eye's seat.
    const orbit: AutoMovieHumanHeadOrbit.IInput = { plan, face: f, eye };
    let out: number = 0;
    out -= AutoMovieHumanHeadOrbit.socket(orbit, y, a);
    out -= AutoMovieHumanHeadOrbit.seat(orbit, y, a);

    // The jaw joint, ahead of the ear.
    out += AutoMovieHumanHeadJawJoint.height(
      { plan, base: compiled.prior.frame.base },
      y,
      a,
    );

    // The nose, and the alar crease that sets each lobule back into the cheek.
    const nose: AutoMovieHumanHeadNoseFrame.IFrame = AutoMovieHumanHeadNoseFrame.at(plan, f, y);
    out += AutoMovieHumanHeadNose.height({ plan, face: f, compiled }, y, a);
    out -= AutoMovieHumanHeadNoseCrease.depth(nose, f, k, y, a);

    // The philtrum between the nose's base and the lip.
    out -= AutoMovieHumanHeadPhiltrum.depth(plan, f, y, a);

    // The lips over their borders, and the fissure between them.
    const lips: AutoMovieHumanHeadLipFrame.IFrame | null = AutoMovieHumanHeadLipFrame.at(plan, a);
    if (lips !== null) {
      out += AutoMovieHumanHeadUpperLip.bulge(plan, lips, y);
      out += AutoMovieHumanHeadLowerLip.bulge(plan, lips, y);
      out -= AutoMovieHumanHeadOralGroove.depth(plan, f, lips, y);
    }

    return out * front;
  }
}
