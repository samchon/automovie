import type {
  IAutoMovieHumanDigitSection,
  IAutoMovieHumanDigitSpan,
} from "@automovie/interface";

import { AutoMovieHumanSeam } from "../lofting/AutoMovieHumanSeam";

/**
 * A phalanx's span: how a digit's section shape runs along one bone, in
 * normalised coordinates of that bone, the same for every person.
 *
 * A digit has three spans, each on its own bone with its own axis: the
 * proximal phalanx from the web to the PIP, the middle phalanx from the PIP
 * to the DIP, and the distal phalanx from the DIP to where the tip rounds.
 * The section shape at a station is a share of the finger's root half width
 * `w0` (the skin's half width where the finger parts from its neighbours):
 * one share each for the half width, the palmar depth and the dorsal depth,
 * given at four stations along the finger, the web, the PIP, the DIP and the
 * start of the tip's cap. Inside a phalanx the shares run by the cubic
 * Hermite of its two end values, with each end's slope the mean of the two
 * secants meeting there, so the shape's slope is continuous through every
 * joint (a Catmull-Rom of the four stations).
 *
 * The four stations' shares are OBSERVED, not fitted to any person: the
 * means of f1's four fingers read on its bone-normal digit sections
 * (`limbs/<finger>_l-v3`) at the joint stations of Buryanov and Kotiuk 2010
 * (PIP at 0.41, DIP at 0.72 of the web-to-tip length), each checked against
 * the reference mesh cut at the same plane. Only f1 has bone-normal sections
 * (the references' README), so no person was held out; the shares are a
 * first reading whose generality the quality phase must test on the other
 * references' mesh cuts.
 */
export namespace AutoMovieHumanDigitSpan {
  /** The four stations' shares: web, PIP, DIP and the tip cap's start: OBSERVED means of f1's four fingers. */
  export const KNOTS: readonly IAutoMovieHumanDigitSpan.IKnot[] = [
    { width: 1.0, palmar: 0.97, dorsal: 0.93 },
    { width: 0.9, palmar: 0.85, dorsal: 0.78 },
    { width: 0.76, palmar: 0.78, dorsal: 0.58 },
    { width: 0.6, palmar: 0.58, dorsal: 0.35 },
  ];

  /**
   * The section shape at a share along a phalanx.
   *
   * @param input The finger's root.
   * @param phalanx Which bone.
   * @param sigma Share of the way along the phalanx's bone, 0 at its proximal joint and 1 at its distal one.
   */
  export function shape(
    input: IAutoMovieHumanDigitSpan.IInput,
    phalanx: IAutoMovieHumanDigitSpan.Phalanx,
    sigma: number,
  ): IAutoMovieHumanDigitSection.IShape {
    const i: number = START[phalanx];
    const u: number = Math.min(1, Math.max(0, sigma));
    const at = (key: keyof IAutoMovieHumanDigitSpan.IKnot): number => {
      // The four stations around the phalanx, the outer two held at the ends,
      // and the mean slope at each end of the phalanx (a Catmull-Rom).
      const v: number[] = [-1, 0, 1, 2].map(
        (o: number): number =>
          KNOTS[Math.min(KNOTS.length - 1, Math.max(0, i + o))]![key],
      );

      return AutoMovieHumanSeam.hermite(
        [v[1]!],
        [(v[2]! - v[0]!) / 2],
        [v[2]!],
        [(v[3]! - v[1]!) / 2],
        u,
      )[0]!;
    };
    const w: number = input.root * at("width");
    const palmar: number = input.root * at("palmar");
    const dorsal: number = input.root * at("dorsal");

    return {
      width: w,
      palmar,
      dorsal,
      side: (w * w) / (palmar * dorsal),
      palmarApex: input.apex,
      dorsalApex: input.apex,
    };
  }

  /*
   * The knot index at each phalanx's start.
   */
  const START: Record<IAutoMovieHumanDigitSpan.Phalanx, number> = {
    proximal: 0,
    middle: 1,
    distal: 2,
  };
}
