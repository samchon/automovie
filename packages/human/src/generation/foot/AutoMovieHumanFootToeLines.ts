import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootFrame,
  IAutoMovieHumanFootPrior,
  IAutoMovieHumanFootToeLines,
} from "@automovie/interface";

import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import { AutoMovieHumanHandWindow } from "../hand/AutoMovieHumanHandWindow";
import { AutoMovieHumanFootToeTaper } from "./AutoMovieHumanFootToeTaper";

/**
 * Each toe's line, from its metatarsal head to its apex.
 *
 * The apex stands where the line puts the toe's distal pad on the floor: the
 * pad's plantar skin lies {@link PAD_CLEARANCE} above the floor at {@link PAD} of
 * the line (a convention: the pad is the toe's contact), and the plantar skin
 * lies `depth (1 - dorsal share)` of the pulp's breadth under the line, tapered
 * by the span law's plantar share and raised by the distal pulp's fullness
 * there (`AutoMovieHumanFootToeTaper`, `AutoMovieHumanHandWindow.PULP`), so the
 * line's height at the apex follows from the head's height and the pad's own
 * depth. The joints on the line are `AutoMovieHumanFootToeJoints`.
 */
export namespace AutoMovieHumanFootToeLines {
  /**
   * The lines of a foot's five toes.
   *
   * @param frame The foot's frame.
   * @param heads The metatarsal heads' centres, hallux first.
   * @param phalangealScale Ratio of actual phalanx lengths to the default toe
   *   lines.
   */
  export function of(
    frame: IAutoMovieHumanFootFrame.IFrame,
    heads: readonly AutoMovieVector3Tuple[],
    phalangealScale: number = 1,
  ): IAutoMovieHumanFootToeLines.ILine[] {
    if (!(Number.isFinite(phalangealScale) && phalangealScale > 0))
      throw new Error("Toe phalanx length scale must be finite and positive");
    const prior: IAutoMovieHumanFootPrior.IPrior =
      AutoMovieHumanFootPrior.PRIOR;

    return prior.toes.map(
      (
        t: IAutoMovieHumanFootPrior.IToe,
        k: number,
      ): IAutoMovieHumanFootToeLines.ILine => {
        const shaft: number = 0.5 * t.breadth * frame.B;
        const half: number = shaft * t.pulp;
        const head: AutoMovieVector3Tuple = heads[k]!;

        // The pad's plantar depth as the toe's span reads it: the span law's
        // plantar share at the pad and the distal pulp's fullness there, over
        // the line's plan length (the apex's height changes it by a cosine).
        const plan: AutoMovieVector3Tuple = frame.at(
          t.tip[0],
          t.tip[1],
          head[1],
        );
        const length: number = Math.hypot(
          plan[0] - head[0],
          plan[1] - head[1],
          plan[2] - head[2],
        );
        const apexY = (span: number): number => {
          const plantar0: number =
            2 *
            half *
            t.depth *
            (1 - prior.toeDorsal) *
            AutoMovieHumanFootToeTaper.at(k, span, shaft, PAD * span)[1];
          const joint: number = t.joints[t.joints.length - 1]! * span;
          const middle: number = (joint + span) / 2;
          const plantar: number =
            plantar0 +
            AutoMovieHumanHandWindow.mass(
              AutoMovieHumanHandWindow.PULP,
              { length: span - joint, width: half, depth: plantar0 },
              PAD * span - middle,
              0,
            );
          return head[1] + (plantar + PAD_CLEARANCE - head[1]) / PAD;
        };
        const nominalY: number = apexY(length);
        if (phalangealScale === 1)
          return { head, tip: frame.at(t.tip[0], t.tip[1], nominalY) };

        // Preserve the floor-pad's existing section law at the new full
        // length. With that apex height fixed, the projected length is the
        // other leg of the head-to-apex right triangle.
        const span: number =
          phalangealScale * Math.hypot(length, nominalY - head[1]);
        const y: number = apexY(span);
        const advance: number = planFactor(length, span, y - head[1]);
        return {
          head,
          tip: [
            head[0] + advance * (plan[0] - head[0]),
            y,
            head[2] + advance * (plan[2] - head[2]),
          ],
        };
      },
    );
  }

  /**
   * Project a requested full length between two held heights onto its
   * horizontal course.
   */
  export function planFactor(
    planLength: number,
    length: number,
    rise: number,
  ): number {
    const projectionSquared: number = length ** 2 - rise ** 2;
    if (
      !(
        Number.isFinite(projectionSquared) &&
        projectionSquared > 0 &&
        planLength > 0
      )
    )
      throw new Error("The requested toe length cannot reach its floor pad");
    return Math.sqrt(projectionSquared) / planLength;
  }
}

/** Share of a toe's line at which its distal pad rests on the floor. Convention. */
const PAD: number = 0.8;

/** The pad's plantar skin over the floor, mm. Convention. */
const PAD_CLEARANCE: number = 0.5;
