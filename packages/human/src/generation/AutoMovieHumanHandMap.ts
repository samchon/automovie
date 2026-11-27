import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmPrior,
  IAutoMovieHumanHandScales,
} from "@automovie/interface";

import { AutoMovieHumanArmPrior } from "./AutoMovieHumanArmPrior";

/**
 * The hand's map from the form's axes to the left frame: along, across and
 * through scales about an origin.
 */
export namespace AutoMovieHumanHandMap {
  /** A hand's map from the prior's axes to the left frame. */
  export function handPoint(
    q: Readonly<AutoMovieVector3Tuple>,
    hand: IAutoMovieHumanHandScales,
    origin: Readonly<AutoMovieVector3Tuple>,
  ): AutoMovieVector3Tuple {
    const prior: IAutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    const a: number = q[0] * hand.along;
    const b: number = q[1] * hand.across;
    const c: number = q[2] * hand.through;
    return [
      origin[0] +
        a * prior.along[0] +
        b * prior.across[0] +
        c * prior.through[0],
      origin[1] +
        a * prior.along[1] +
        b * prior.across[1] +
        c * prior.through[1],
      origin[2] +
        a * prior.along[2] +
        b * prior.across[2] +
        c * prior.through[2],
    ];
  }
}
