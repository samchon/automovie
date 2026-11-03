import { AutoMovieHumanHandWindow } from "./AutoMovieHumanHandWindow";

const { bump }: typeof AutoMovieHumanHandWindow = AutoMovieHumanHandWindow;

/**
 * The swelling of a digit's section at an interphalangeal or
 * metacarpophalangeal joint: the joint's skin stands proud of the shafts it
 * joins (Bridgman 1920: finger joints are square, shafts narrower; the middle
 * joint is the largest), written as a relief window along the digit's
 * centre line.
 *
 * The window's axis is the joint's own: across the finger through the joint
 * centre, the flexion axis; the swelling moves each section's skin outward
 * from the bone by `height(s)` at arc length `s` along the line, in every
 * direction of the section alike (a joint swells all round). It vanishes with
 * its slope and curvature at the window's edge, so a span's sections meet
 * the joint's window C2 whatever the amplitude.
 *
 * The amplitude is `SHARE` of the joint's radius. `SHARE` is an UPPER BOUND
 * read on f1's bone-normal digit sections in the relaxed capture: the girth
 * falls monotonically along every finger at the sections' 1.9 mm spacing,
 * with no step above 0.3 mm at the PIP or DIP, so a swelling above about 4 %
 * of the radius is not there. It is a convention until the extended-finger
 * references the quality phase needs are read.
 */
export namespace AutoMovieHumanDigitJointRelief {
  /** Amplitude as a share of the joint's radius: upper bound read on f1's relaxed capture, a convention. */
  export const SHARE: number = 0.04;

  /** A joint's fixed inputs. */
  export interface IInput {
    /** Arc length of the joint's centre along the digit's line, mm. */
    at: number;

    /** Half extent of the window along the line, mm; the joint's turn half-length is the natural size. */
    half: number;

    /** The joint's radius, mm: the mean of the section's half width and depth there. */
    radius: number;
  }

  /**
   * The outward displacement of the skin at arc length `s`, mm.
   *
   * @param input The joint.
   * @param s Arc length along the line, mm.
   */
  export function height(input: IInput, s: number): number {
    return SHARE * input.radius * bump((s - input.at) / input.half).value;
  }

  /**
   * Its slope along the line, mm per mm.
   *
   * @param input The joint.
   * @param s Arc length along the line, mm.
   */
  export function slope(input: IInput, s: number): number {
    return (SHARE * input.radius * bump((s - input.at) / input.half).slope) / input.half;
  }
}
