import { AutoMovieHumanHandWindow } from "./AutoMovieHumanHandWindow";

const { ellipse }: typeof AutoMovieHumanHandWindow = AutoMovieHumanHandWindow;

/**
 * The thenar eminence: the thumb's pyramidal base, the larger and rounder of
 * the hand's two masses (Bridgman 1920, `docs/anatomy/hand.md`, Form), its
 * own piece with the first metacarpal's axis.
 *
 * It is a relief over the palmar sector (`IAutoMovieHumanRelief`, rule J7):
 * a height over the palmar skin along the palmar normal, in the frame of the
 * first metacarpal (origin at the middle of the muscle belly, `along` the
 * metacarpal's direction, `across` the palm's across axis), an elliptic
 * window of half extents `(a, b)`
 *
 * ```text
 * h(s, t) = HEIGHT_SHARE * W * (1 - (s / a)^2 - (t / b)^2)^3
 * ```
 *
 * with `W` the palm's half width. The window's length `a` is
 * {@link LENGTH_SHARE} of the first metacarpal (Reddy 2024: 0.711 of the
 * third), its half width `b` {@link WIDTH_SHARE} of the palm's. It vanishes
 * with slope and curvature at its edge; where it meets the palmar sector the
 * thenar crease is the declared G1 seam (a groove the window's edge cannot
 * make), so the window ends short of the crease by a margin of its own.
 *
 * The shares are CONVENTIONS to be read on the references' hand sections;
 * today's thenar is the ellipse in `AutoMovieHumanArmPrior`'s thenar,
 * 14 mm half width and depth, which these shares reproduce within 20 % for f1.
 */
export namespace AutoMovieHumanThenar {
  /** Eminence height over the palm's half width: a convention. */
  export const HEIGHT_SHARE: number = 0.3;

  /** Half length over the first metacarpal's length: a convention. */
  export const LENGTH_SHARE: number = 0.6;

  /** Half width over the palm's half width: a convention. */
  export const WIDTH_SHARE: number = 0.35;

  /** A mass's fixed inputs. */
  export interface IInput {
    /** The first metacarpal's length, mm. */
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
