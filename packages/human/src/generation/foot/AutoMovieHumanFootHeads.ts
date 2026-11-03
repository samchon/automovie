import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

type Vec3 = G.Vec3;

/**
 * The metatarsal heads: the five joints the toes start from, and their mean,
 * the ball. The first head stands at ANSUR II's ball-of-foot length; the second
 * is Maestro's lead ahead of it and the other three stand behind it by his
 * cascade (millimetres of a foot of `CASCADE_FOOT`, scaled by the foot's
 * length); each head's across place and height are the prior's reference
 * medians.
 */
export namespace AutoMovieHumanFootHeads {
  /** The heads and their mean. */
  export interface IHeads {
    /** Head centres, hallux first, left frame. */
    heads: Vec3[];

    /** Mean of the heads, left frame. */
    ball: Vec3;
  }

  /**
   * The heads of a foot.
   *
   * @param frame The foot's frame.
   */
  export function of(frame: AutoMovieHumanFootFrame.IFrame): IHeads {
    const prior: AutoMovieHumanFootPrior.IPrior = AutoMovieHumanFootPrior.PRIOR;

    // Maestro's cascade, in millimetres of his reference foot, scales with the
    // foot's length; the second head leads the first, the rest trail it.
    const scale: number = frame.L / AutoMovieHumanFootPrior.CASCADE_FOOT;
    const along: number[] = [prior.first, prior.first + (prior.cascade[0]! * scale) / frame.L];
    for (let k: number = 1; k < prior.cascade.length; k++)
      along.push(along[along.length - 1]! - (prior.cascade[k]! * scale) / frame.L);

    const heads: Vec3[] = prior.toes.map(
      (t: AutoMovieHumanFootPrior.IToe, k: number): Vec3 => frame.at(along[k]!, t.head, t.height * frame.L),
    );
    const ball: Vec3 = [0, 1, 2].map(
      (i: number): number => heads.reduce((sum: number, p: Vec3): number => sum + p[i]!, 0) / heads.length,
    ) as Vec3;

    return { heads, ball };
  }
}
