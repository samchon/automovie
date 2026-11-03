import { AutoMovieHumanHandWindow } from "./AutoMovieHumanHandWindow";

const { ellipse }: typeof AutoMovieHumanHandWindow = AutoMovieHumanHandWindow;

/**
 * The hypothenar eminence: the long narrow mass along the fifth metacarpal on
 * the ulnar side of the palm (Bridgman 1920, `docs/anatomy/hand.md`, Form), its
 * own piece with the fifth metacarpal's axis.
 *
 * A relief over the palmar sector like the thenar, in the frame of the
 * fifth metacarpal, but long and narrow: an elliptic window of half length
 * {@link LENGTH_SHARE} of the fifth metacarpal (Reddy 2024: 0.797 of the
 * third) and half width {@link WIDTH_SHARE} of the palm's half width, its
 * height {@link HEIGHT_SHARE} of that half width, lower than the thenar's. It
 * meets the palmar sector at the proximal palmar crease, a declared G1 seam.
 *
 * The shares are CONVENTIONS: the thenar is larger and rounder, the
 * hypothenar long and narrow, by Bridgman, and no mass is measured in the
 * repository.
 */
export namespace AutoMovieHumanHypothenar {
  /** Eminence height over the palm's half width: a convention. */
  export const HEIGHT_SHARE: number = 0.18;

  /** Half length over the fifth metacarpal's length: a convention. */
  export const LENGTH_SHARE: number = 0.7;

  /** Half width over the palm's half width: a convention. */
  export const WIDTH_SHARE: number = 0.2;

  /** A mass's fixed inputs. */
  export interface IInput {
    /** The fifth metacarpal's length, mm. */
    metacarpal: number;

    /** The palm's half width, mm. */
    palm: number;
  }

  /**
   * The mass's height over the palmar skin, mm.
   *
   * @param input The mass's inputs.
   * @param s Along the metacarpal from the belly's middle, mm.
   * @param t Across it, mm.
   */
  export function height(input: IInput, s: number, t: number): number {
    return HEIGHT_SHARE * input.palm * ellipse(s / (LENGTH_SHARE * input.metacarpal), t / (WIDTH_SHARE * input.palm));
  }
}
