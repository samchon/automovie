import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootFrame,
} from "@automovie/interface";

import { AutoMovieHumanFootPlaces } from "../AutoMovieHumanFootPlaces";

/** Dorsal guide from the first web to the measured arch site. */
export namespace AutoMovieHumanFootCrestForefoot {
  /**
   * Nominal guide stations at the metatarsal head, above its web and at the
   * arch.
   */
  const SHARES: readonly number[] = [
    (1 + AutoMovieHumanFootPlaces.BALL) / 2,
    AutoMovieHumanFootPlaces.BALL,
    (AutoMovieHumanFootPlaces.BALL + 1 / 2) / 2,
    1 / 2,
  ];

  /** World dorsal guide points from the shared smooth roof law. */
  export function knots(
    frame: IAutoMovieHumanFootFrame.IFrame,
  ): AutoMovieVector3Tuple[] {
    return SHARES.map(
      (share: number): AutoMovieVector3Tuple =>
        frame.at(share, across(share), depth(share) * frame.L),
    );
  }

  /** Roof height above the floor in foot lengths. */
  export function depth(share: number): number {
    return AutoMovieHumanFootPlaces.dorsum(1, share);
  }

  /** ESTIMATE: the dorsum crest runs over the medial third of the forefoot. */
  export function across(_share: number): number {
    return 1 / 3;
  }
}
