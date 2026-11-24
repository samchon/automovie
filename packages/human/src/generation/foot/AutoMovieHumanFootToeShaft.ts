import type { IAutoMovieHumanFootFrame } from "@automovie/interface";

import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";

/**
 * A toe's shaft: the half breadth of the proximal and middle phalanges' tube,
 * constant along the toe before the pulp widens it and the root flares it.
 * The toe's breadth is its assigned transverse bay in foot breadths. The
 * shaft uses half of that share in millimetres.
 */
export namespace AutoMovieHumanFootToeShaft {
  /**
   * The shaft's half breadth, mm.
   *
   * @param frame The foot's frame.
   * @param index Which toe, 0 for the hallux.
   */
  export function half(
    frame: IAutoMovieHumanFootFrame.IFrame,
    index: number,
  ): number {
    return 0.5 * AutoMovieHumanFootPrior.PRIOR.toes[index]!.breadth * frame.B;
  }
}
