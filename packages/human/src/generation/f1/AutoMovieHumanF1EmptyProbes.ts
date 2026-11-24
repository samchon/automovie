import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
} from "@automovie/interface";

import type { AutoMovieHumanEmptyProbes } from "../conic/AutoMovieHumanEmptyProbes";
import { AutoMovieHumanF1 } from "./AutoMovieHumanF1";

/**
 * The four fingers in order across the hand, from the index finger, each
 * neighbouring pair a gap.
 */
const FINGERS: readonly string[] = [
  "finger.index",
  "finger.middle",
  "finger.ring",
  "finger.pinky",
];

/**
 * What f1's empty probes are read from (`AutoMovieHumanEmptyProbes.list`): its
 * stored cutters (the armpit's slit, each ear's bowl and each nostril), its leg
 * family, whose twin is the other leg, and its four fingers across the hand.
 * The thumb stands apart from the fingers and its web is not a gap between
 * parallel walls, and f1's mouth is a height field over the trunk's wall with
 * no gap between the lips, so neither has a probe.
 *
 * @throws {Error} At load, when a finger is missing from
 *   `AutoMovieHumanF1.DIGITS`.
 */
export const AutoMovieHumanF1EmptyProbes: AutoMovieHumanEmptyProbes.IListing = {
  cutters: AutoMovieHumanF1.CUTTERS,
  leg: AutoMovieHumanF1.BODY.leg,
  fingers: FINGERS.map((name: string): IAutoMovieHumanConicLoft.IFamily => {
    const digit: IAutoMovieHumanF1.IDigit | undefined =
      AutoMovieHumanF1.DIGITS.find(
        (d: IAutoMovieHumanF1.IDigit): boolean => d.family.name === name,
      );
    if (digit === undefined)
      throw new Error(`f1 empty probes: no digit ${name}`);
    return digit.family;
  }),
};
