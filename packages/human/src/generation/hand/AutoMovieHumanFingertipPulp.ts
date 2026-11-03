import { AutoMovieHumanHandWindow } from "./AutoMovieHumanHandWindow";

const { ellipse }: typeof AutoMovieHumanHandWindow = AutoMovieHumanHandWindow;

/**
 * The fingertip pulp: the fat pad of the palmar side of the distal phalanx,
 * from the distal interphalangeal crease to the apex, its own piece with its
 * own axis.
 *
 * The pulp's axis is the pad's: its origin the middle of the pad on the
 * palmar sector, its `along` the bone's direction, its `normal` the palmar
 * normal of the skin there (between the bone's palmar direction and the nail
 * plate's inward normal, since the pad wraps round the tip). It adds
 * fullness over the palmar sector by an elliptic window of the pad's
 * footprint: half extent `a` along the line over `LENGTH_SHARE` of the distal
 * phalanx, half extent `b` across over `WIDTH_SHARE` of the section's half
 * width,
 *
 * ```text
 * h(s, t) = FULLNESS * D * (1 - (s / a)^2 - (t / b)^2)^3
 * ```
 *
 * with `D` the palmar depth of the section at the pad's middle. It vanishes
 * with its slope and curvature at the footprint's edge, so it meets the
 * palmar sector without a seam, and ends on the tip cap, which it meets G2
 * (the pad is the thing the cap's palmar side is built from, so the
 * cap's sections take the pulp's height at their last rings).
 *
 * The shares are CONVENTIONS: no pulp thickness is in the repository, and
 * f1's tip sections show the palmar depth rising over the distal phalanx
 * (index 7.3 to 7.8 mm against the dorsal 3.8 to 2.0) while the dorsal falls,
 * which the span law's distal knots already carry; the pulp is the extra a
 * knot cannot, localised at the pad.
 */
export namespace AutoMovieHumanFingertipPulp {
  /** Footprint half length over the distal phalanx's length: a convention. */
  export const LENGTH_SHARE: number = 0.45;

  /** Footprint half width over the section's half width: a convention. */
  export const WIDTH_SHARE: number = 0.85;

  /** Height over the palmar depth at the pad's middle: a convention. */
  export const FULLNESS: number = 0.12;

  /** A pad's fixed inputs. */
  export interface IInput {
    /** Length of the distal phalanx, mm. */
    phalanx: number;

    /** Half width of the section at the pad's middle, mm. */
    width: number;

    /** Palmar depth of the section at the pad's middle, mm. */
    palmar: number;
  }

  /**
   * The pad's added height over the palmar skin, mm.
   *
   * @param input The pad's inputs.
   * @param s Along the line from the pad's middle, mm, positive toward the tip.
   * @param t Across the line from its middle, mm.
   */
  export function height(input: IInput, s: number, t: number): number {
    return FULLNESS * input.palmar * ellipse(s / (LENGTH_SHARE * input.phalanx), t / (WIDTH_SHARE * input.width));
  }
}
