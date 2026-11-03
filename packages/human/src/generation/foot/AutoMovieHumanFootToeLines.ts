import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import { AutoMovieHumanFingertipPulp } from "../hand/AutoMovieHumanFingertipPulp";
import { AutoMovieHumanFootToeTaper } from "./AutoMovieHumanFootToeTaper";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

type Vec3 = G.Vec3;

/**
 * Each toe's line, from its metatarsal head to its apex.
 *
 * The apex stands where the line puts the toe's distal pad on the floor: the
 * pad's plantar skin lies {@link PAD_CLEARANCE} above the floor at
 * {@link PAD} of the line (a convention: the pad is the toe's contact), and the
 * plantar skin lies `depth (1 - dorsal share)` of the pulp's breadth under the
 * line, tapered by the span law's plantar share and raised by the distal
 * pulp's fullness there (`AutoMovieHumanFootToeTaper`,
 * `AutoMovieHumanFingertipPulp`), so the line's height at the apex follows from
 * the head's height and the pad's own depth. The joints on the line are
 * `AutoMovieHumanFootToeJoints`.
 */
export namespace AutoMovieHumanFootToeLines {
  /** A toe's line. */
  export interface ILine {
    /** Metatarsal head centre, left frame. */
    head: Vec3;

    /** The apex, left frame. */
    tip: Vec3;
  }

  /**
   * The lines of a foot's five toes.
   *
   * @param frame The foot's frame.
   * @param heads The metatarsal heads' centres, hallux first.
   */
  export function of(frame: AutoMovieHumanFootFrame.IFrame, heads: readonly Vec3[]): ILine[] {
    const prior: AutoMovieHumanFootPrior.IPrior = AutoMovieHumanFootPrior.PRIOR;

    return prior.toes.map((t: AutoMovieHumanFootPrior.IToe, k: number): ILine => {
      const shaft: number = 0.5 * t.breadth * frame.B;
      const half: number = shaft * t.pulp;
      const head: Vec3 = heads[k]!;

      // The pad's plantar depth as the toe's span reads it: the span law's
      // plantar share at the pad and the distal pulp's fullness there, over
      // the line's plan length (the apex's height changes it by a cosine).
      const plan: Vec3 = frame.at(t.tip[0], t.tip[1], head[1]);
      const length: number = Math.hypot(plan[0] - head[0], plan[1] - head[1], plan[2] - head[2]);
      const plantar0: number = 2 * half * t.depth * (1 - prior.toeDorsal) * AutoMovieHumanFootToeTaper.at(k, length, shaft, PAD * length)[1];
      const joint: number = t.joints[t.joints.length - 1]! * length;
      const middle: number = (joint + length) / 2;
      const plantar: number =
        plantar0 + AutoMovieHumanFingertipPulp.height({ phalanx: length - joint, width: half, palmar: plantar0 }, PAD * length - middle, 0);
      const y: number = head[1] + (plantar + PAD_CLEARANCE - head[1]) / PAD;

      return { head, tip: frame.at(t.tip[0], t.tip[1], y) };
    });
  }
}

/** Share of a toe's line at which its distal pad rests on the floor. Convention. */
const PAD: number = 0.8;

/** The pad's plantar skin over the floor, mm. Convention. */
const PAD_CLEARANCE: number = 0.5;
