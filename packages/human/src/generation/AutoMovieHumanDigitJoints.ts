import { AutoMovieEngineHandAnthropometry } from "@automovie/engine";
import type {
  AutoMovieHumanSex as AutoMovieHumanSexType,
  IAutoMovieHandAnthropometry,
} from "@automovie/interface";

import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";

/**
 * Each digit's breadth and girth at its two joints nearest the tip: the
 * digit's front-view outline and its tape at the knots the digit walk turns
 * at.
 *
 * Source: the population table `@automovie/engine`'s
 * `AutoMovieEngineHandAnthropometry` holds (Rastgoo Balov et al. 2026, SAGE Open
 * Med, PMC13039577, Tables 1 and 2: the right hands of 51 women and 49 men,
 * each digit's breadth and girth at its first and second joint from the tip,
 * with the hand length; means), which the objects a hand takes read too.
 *
 * Derivation: the person's digits scale with their hand length over the
 * sample's mean hand length. A joint's depth is not published; its box's
 * range (`AutoMovieHumanBodyBox.range`) bounds it from the breadth and girth,
 * between `girth / 2 - breadth` and `sqrt(girth^2 / 4 - breadth^2)`.
 *
 * Limits: the table's own, stated where it is held.
 */
export namespace AutoMovieHumanDigitJoints {
  /**
   * A digit's joint, scaled to the person's hand.
   *
   * @param sex The person's sex.
   * @param handLength The person's hand length, mm.
   * @param digit 1 (thumb) to 5 (little).
   * @param joint 1, the joint nearest the tip, or 2, the next.
   * @returns The joint's breadth and girth, mm.
   */
  export function at(
    sex: AutoMovieHumanSexType,
    handLength: number,
    digit: 1 | 2 | 3 | 4 | 5,
    joint: 1 | 2,
  ): IAutoMovieHandAnthropometry.IJoint {
    const k: 0 | 1 = sex === AutoMovieHumanSex.Female ? 0 : 1;
    const scale: number =
      handLength / AutoMovieEngineHandAnthropometry.HAND_LENGTH[k];
    const read: IAutoMovieHandAnthropometry.IJoint =
      AutoMovieEngineHandAnthropometry.JOINTS[k][digit - 1]![joint - 1]!;
    return { breadth: scale * read.breadth, girth: scale * read.girth };
  }
}
