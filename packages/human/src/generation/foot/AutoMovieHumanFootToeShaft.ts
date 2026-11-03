import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";

/**
 * A toe's shaft: the half breadth of the proximal and middle phalanges' tube,
 * constant along the toe before the pulp widens it and the root flares it.
 * The toe's breadth is the prior's reference median in foot breadths for that
 * digit (the hallux's is 0.274 B, the fifth toe's 0.139 B), so the half breadth
 * is half of it in millimetres, scaled by the person's foot breadth.
 */
export namespace AutoMovieHumanFootToeShaft {
  /**
   * The shaft's half breadth, mm.
   *
   * @param frame The foot's frame.
   * @param index Which toe, 0 for the hallux.
   */
  export function half(frame: AutoMovieHumanFootFrame.IFrame, index: number): number {
    return 0.5 * AutoMovieHumanFootPrior.PRIOR.toes[index]!.breadth * frame.B;
  }
}
