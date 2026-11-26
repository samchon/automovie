import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootFrame,
  IAutoMovieHumanFootHeads,
  IAutoMovieHumanFootPrior,
} from "@automovie/interface";

import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";

/**
 * The metatarsal heads: the five joints the toes start from, and their mean,
 * the ball. The first head stands at ANSUR II's ball-of-foot length; the second
 * is Maestro's lead ahead of it and the other three stand behind it by his
 * cascade (millimetres of a foot of `CASCADE_FOOT`, scaled by the foot's
 * length); each head's across place and height are the prior's reference
 * medians.
 */
export namespace AutoMovieHumanFootHeads {
  /**
   * The heads of a foot.
   *
   * @param frame The foot's frame.
   */
  export function of(
    frame: IAutoMovieHumanFootFrame.IFrame,
  ): IAutoMovieHumanFootHeads.IHeads {
    const prior: IAutoMovieHumanFootPrior.IPrior =
      AutoMovieHumanFootPrior.PRIOR;

    // Maestro's cascade, in millimetres of his reference foot, scales with the
    // foot's length; the second head leads the first, the rest trail it.
    const scale: number = frame.L / AutoMovieHumanFootPrior.CASCADE_FOOT;
    const along: number[] = [
      prior.first,
      prior.first + (prior.cascade[0]! * scale) / frame.L,
    ];
    for (let k: number = 1; k < prior.cascade.length; k++)
      along.push(
        along[along.length - 1]! - (prior.cascade[k]! * scale) / frame.L,
      );

    const heads: AutoMovieVector3Tuple[] = prior.toes.map(
      (t: IAutoMovieHumanFootPrior.IToe, k: number): AutoMovieVector3Tuple =>
        frame.at(along[k]!, t.head, t.height * frame.L),
    );
    const ball: AutoMovieVector3Tuple = [0, 1, 2].map(
      (i: number): number =>
        heads.reduce(
          (sum: number, p: AutoMovieVector3Tuple): number => sum + p[i]!,
          0,
        ) / heads.length,
    ) as AutoMovieVector3Tuple;

    return { heads, ball };
  }
}
