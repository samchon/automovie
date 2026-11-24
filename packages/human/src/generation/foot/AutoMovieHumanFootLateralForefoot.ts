import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootFrame,
  IAutoMovieHumanFootWebLine,
} from "@automovie/interface";

import { AutoMovieHumanFootPlaces } from "../AutoMovieHumanFootPlaces";
import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";

/** The lateral toe web, fifth metatarsal head and lateral midfoot guide. */
export namespace AutoMovieHumanFootLateralForefoot {
  /** World guide through the fifth-ray head with lowered outer border. */
  export function knots(
    frame: IAutoMovieHumanFootFrame.IFrame,
    _line: IAutoMovieHumanFootWebLine.IWebLine,
  ): AutoMovieVector3Tuple[] {
    const prior = AutoMovieHumanFootPrior.PRIOR;
    const drop: number = prior.cascade
      .slice(1)
      .reduce((sum: number, value: number): number => sum + value, 0);
    const head: number =
      prior.first - drop / AutoMovieHumanFootPrior.CASCADE_FOOT;
    return [
      frame.at(
        (head + AutoMovieHumanFootPlaces.TOES[4]!.tip) / 2,
        5 / 6,
        ringHeight() * frame.L,
      ),
      frame.at(head, 1, ringHeight() * frame.L),
      frame.at(
        (head + AutoMovieHumanFootPlaces.ANKLE) / 2,
        5 / 6,
        ringHeight() * frame.L,
      ),
    ];
  }

  /**
   * ESTIMATE: the lateral border leaves the floor at a quarter of the dorsal
   * height at the first head.
   */
  export function ringHeight(): number {
    return (
      AutoMovieHumanFootPlaces.dorsum(1, AutoMovieHumanFootPlaces.BALL) / 4
    );
  }
}
