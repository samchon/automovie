import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanDigitJoints } from "./AutoMovieHumanDigitJoints";

/**
 * Each fingernail plate's width and length, from the digit's breadth at its
 * distal joint.
 *
 * Sources: Li G. et al., "Investigation and analysis of hand characteristics
 * of Chinese Han youth in Shandong province", Medicine (Baltimore) 2025,
 * doi 10.1097/MD.0000000000043189, PMC12212799, Table 4: the nail plate's
 * transverse diameter of the index, middle and ring fingers, both hands, 320
 * young men and 530 young women (8.8, 9.2 and 8.5 mm in women, 10.0, 10.4 and
 * 9.65 mm in men, the hands' mean). Jung J.W. et al., "Fingernail
 * configuration", Arch Plast Surg 42(6):753 (2015), PMC4659990: the plate's
 * width over its length from the thumb to the little finger, 150 men and 150
 * women (men 1.04, 0.94, 0.95, 0.95, 0.93; women 0.91 at every digit).
 *
 * Derivation: the three measured plates' widths over the same digits'
 * breadths at the distal joint (`AutoMovieHumanDigitJoints`, Rastgoo Balov et
 * al. 2026) are 0.625, 0.653 and 0.646 in women and 0.652, 0.661 and 0.652 in
 * men, near one share across the digits, so the plate's width is that share's
 * mean, 0.641 or 0.655, of the person's distal joint breadth at every digit,
 * the thumb and the little finger included; its length is the width over
 * Jung's ratio for the digit.
 *
 * Limits: three populations (Han Chinese youths, Koreans, Iranian students)
 * meet in one law; the plate is its visible body from the proximal fold to the
 * free margin's start, as Jung defines it, not the hidden matrix.
 */
export namespace AutoMovieHumanNailPlate {
  /** The plate's width over the distal joint's breadth, women and men. */
  export const WIDTH_SHARE: readonly [number, number] = [0.641, 0.655];

  /** The plate's width over its length, thumb to little finger, women then men (Jung et al. 2015). */
  export const WIDTH_OVER_LENGTH: readonly [readonly number[], readonly number[]] = [
    [0.91, 0.91, 0.91, 0.91, 0.91],
    [1.04, 0.94, 0.95, 0.95, 0.93],
  ];

  /**
   * A digit's nail plate.
   *
   * @param sex The person's sex.
   * @param handLength The person's hand length, mm.
   * @param digit 1 (thumb) to 5 (little).
   * @returns The plate's width and length, mm.
   */
  export function of(sex: AutoMovieHumanSex, handLength: number, digit: 1 | 2 | 3 | 4 | 5): { width: number; length: number } {
    const k: 0 | 1 = sex === AutoMovieHumanSex.Female ? 0 : 1;
    const width: number = WIDTH_SHARE[k] * AutoMovieHumanDigitJoints.at(sex, handLength, digit, 1).breadth;
    return { width, length: width / WIDTH_OVER_LENGTH[k][digit - 1]! };
  }
}
