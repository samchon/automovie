import { AutoMovieHumanMonotoneCubic } from "../../lofting/AutoMovieHumanMonotoneCubic";
import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";

/**
 * A toe's pulp: the distal pad's widening of the shaft, a factor of 1 along
 * the proximal half of the line, rising by a monotone cubic from
 * {@link FROM} to {@link AT} of the line to the toe's pulp ratio (the hallux's
 * is 1.1, a lesser toe's 1.02, reference medians) and holding it to the tip.
 * Own axis: the toe's line, the pad being the toe's contact with the floor.
 */
export namespace AutoMovieHumanFootToePulp {
  /**
   * The pulp's factor at a share of the line.
   *
   * @param index Which toe, 0 for the hallux.
   * @param share Place along the line from the metatarsal head, 0 to 1.
   */
  export function factor(index: number, share: number): number {
    const pulp: number = AutoMovieHumanFootPrior.PRIOR.toes[index]!.pulp;

    return AutoMovieHumanMonotoneCubic.interpolate(
      [
        [0, 1],
        [FROM, 1],
        [AT, pulp],
        [1, pulp],
      ],
      share,
    );
  }
}

/** Share of a toe's line where its pulp starts to widen. Convention. */
const FROM: number = 0.5;

/** Share of a toe's line where its pulp reaches its ratio. Convention. */
const AT: number = 0.82;
