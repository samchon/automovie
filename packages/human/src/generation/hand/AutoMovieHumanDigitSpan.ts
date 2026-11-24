import type {
  IAutoMovieHumanDigitSection,
  IAutoMovieHumanDigitSpan,
} from "@automovie/interface";

/**
 * A smooth digit taper on the normalized course from the web to the tip. A
 * quarter ellipsoid is the default where a digit has no measured distal
 * profile. Its course divides into four equal coordinates through PIP, DIP, the
 * cap start and the apex. Equal spacing is an ESTIMATE for the generic profile.
 * Anatomical readers place those sites on their own measured stations and
 * retain each root dimension.
 */
export namespace AutoMovieHumanDigitSpan {
  /** Sections of the unit quarter ellipsoid at the web, PIP, DIP and cap start. */
  export const KNOTS: readonly IAutoMovieHumanDigitSpan.IKnot[] = Array.from(
    { length: 4 },
    (_, index: number): IAutoMovieHumanDigitSpan.IKnot => {
      const radius: number = taper(index);
      return { width: radius, palmar: radius, dorsal: radius };
    },
  );

  /** The phalanx's index in the normalized course. */
  const START: Record<IAutoMovieHumanDigitSpan.Phalanx, number> = {
    proximal: 0,
    middle: 1,
    distal: 2,
  };

  /** Scale an unmeasured section along one span from its known root radius. */
  export function shape(
    input: IAutoMovieHumanDigitSpan.IInput,
    phalanx: IAutoMovieHumanDigitSpan.Phalanx,
    sigma: number,
  ): IAutoMovieHumanDigitSection.IShape {
    const u: number = Math.min(1, Math.max(0, sigma));
    const radius: number = input.root * taper(START[phalanx] + u);
    return {
      width: radius,
      palmar: radius,
      dorsal: radius,
      side: 1,
      palmarApex: input.apex,
      dorsalApex: input.apex,
    };
  }
}

/** Radial scale of the unit ellipsoid at quarter-interval coordinate `k`. */
function taper(k: number): number {
  return Math.sqrt(1 - (k / 4) ** 2);
}
