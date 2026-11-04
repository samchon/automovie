import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

const { smooth }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;

/**
 * The palmar half's depth over the dorsal half's along a digit: how the
 * section's depth is shared between the pad and the back.
 *
 * By phalanx (`AutoMovieHumanArmPrior.PRIOR.hand.palmar`, OBSERVED on f1's
 * bone-normal digit sections, the four fingers' means): the palmar pad is the
 * fuller half over the proximal and middle phalanges, a share held over each
 * and handed over across the PIP within {@link HANDOVER} of the distal
 * phalanx's length either side; from the DIP the share rises over the
 * distal phalanx to the nail bed's middle, where the dorsal skin is thinnest
 * over the nail, and falls to the round tip. The share and the section's
 * depth `h` give the two halves: `palmar = 2 h r / (1 + r)` and
 * `dorsal = 2 h / (1 + r)`, whose sum is `2 h`.
 */
export namespace AutoMovieHumanDigitPalmarShare {
  /** Share of a digit's distal phalanx over which the share hands over at a joint, either side: a convention. */
  export const HANDOVER: number = 0.3;

  /**
   * The share `r` of palmar depth over dorsal depth at a length along the digit.
   *
   * @param s Arc length along the digit's line, mm.
   * @param joints The digit's interphalangeal joints along its line, mm.
   * @param length Arc length of the digit's apex, mm.
   */
  export function at(s: number, joints: readonly number[], length: number): number {
    const shares: AutoMovieHumanArmPrior.IPalmar = AutoMovieHumanArmPrior.PRIOR.hand.palmar;
    const dip: number = joints[joints.length - 1]!;
    const pip: number = joints.length > 1 ? joints[joints.length - 2]! : dip;
    const reach: number = HANDOVER * (length - dip);
    const shaft: number = shares.proximal + (shares.middle - shares.proximal) * smooth((s - pip + reach) / (2 * reach));
    if (s <= dip) return shaft;

    // Over the distal phalanx: up to the nail bed's middle, down to the tip.
    const u: number = (s - dip) / (length - dip);
    return u <= shares.nailAt
      ? shares.middle + (shares.nail - shares.middle) * smooth(u / shares.nailAt)
      : shares.nail + (shares.tip - shares.nail) * smooth((u - shares.nailAt) / (1 - shares.nailAt));
  }
}
