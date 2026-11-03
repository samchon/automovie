import { AutoMovieHumanHeadNoseAla } from "./AutoMovieHumanHeadNoseAla";
import { AutoMovieHumanHeadNoseBase } from "./AutoMovieHumanHeadNoseBase";
import { AutoMovieHumanHeadNoseBridge } from "./AutoMovieHumanHeadNoseBridge";
import { AutoMovieHumanHeadNoseFrame } from "./AutoMovieHumanHeadNoseFrame";
import { AutoMovieHumanHeadNoseTip } from "./AutoMovieHumanHeadNoseTip";
import type { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadCompiled } from "./IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The nose assembled from its pieces: a column of the dorsum's ridge and the
 * tip's lobule, which share an axis, joined to the alar lobules by a quadratic
 * union, and trimmed from below by the base it stands on, by a harmonic union.
 * A sharper union of lobes that stand apart ruled a valley of 0.75 mm radius
 * between the tip and the wing, under the sections' 1.6 mm controls, and the
 * cells aliased it into teeth at whatever pitch they had.
 *
 * Reads the pieces' own inputs (the nose's frame, the prior's face constants,
 * the compiled splines and the skeleton). Publishes the nose's height over the
 * base surface in millimetres, zero off the nose.
 */
export namespace AutoMovieHumanHeadNose {
  /** What the nose reads. */
  export interface IInput {
    /** The landmark skeleton. */
    plan: IAutoMovieHumanHeadLayout;

    /** The prior's face constants. */
    face: AutoMovieHumanHeadPrior.IFace;

    /** The prior's compiled profile and dorsum splines. */
    compiled: IAutoMovieHumanHeadCompiled;
  }

  /**
   * Height of the nose at a point of the base surface.
   *
   * @param input What the nose reads.
   * @param y Height of the point.
   * @param a Distance of the point from the midline, `|z|`.
   * @returns Height in millimetres.
   */
  export function height(input: IInput, y: number, a: number): number {
    const frame: AutoMovieHumanHeadNoseFrame.IFrame = AutoMovieHumanHeadNoseFrame.at(
      input.plan,
      input.face,
      y,
    );
    const ridge: number = AutoMovieHumanHeadNoseBridge.ridge(
      frame,
      input.compiled,
      input.face.profileKnots,
      a,
    );
    const ball: number = AutoMovieHumanHeadNoseTip.ball(frame, input.face.tipBall, a);
    const ala: number = AutoMovieHumanHeadNoseAla.lobes(frame, input.face.ala, y, a);
    const body: number = Math.hypot((ridge ** NOSE + ball ** NOSE) ** (1 / NOSE), ala);
    const floor: number = AutoMovieHumanHeadNoseBase.floor(input.plan, input.face, y, a);
    const p: number = input.face.underside[1]!;
    return body > 0 && floor > 0 ? (body ** -p + floor ** -p) ** (-1 / p) : 0;
  }

  /** Sharpness of the soft maximum along the nose's own axis: the dorsum and the tip meet by a power mean of this order. */
  export const NOSE: number = 5;
}
