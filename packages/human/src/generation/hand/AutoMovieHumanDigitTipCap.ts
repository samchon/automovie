/**
 * A digit's tip cap: where the tube's sections end and the rounded tip begins.
 *
 * The tube's section keeps its size to a station, called the cap's start,
 * and closes from there on a round end: the cap starts at the first station
 * where the section's radius is at least the distance left to the apex, so
 * the cap's sphere-like end is tangent to the tube (the radius stops
 * changing there, and the end's radius of curvature equals the tube's). The
 * apex lies on the line's last tangent, at the digit's length from the
 * knuckle.
 *
 * The cap takes the pulp's and the nail fold's seams: the pulp meets it G2
 * on the palmar side, and the nail plate's free edge ends over it
 * (`AutoMovieHumanFingertipPulp`, `AutoMovieHumanNailPlate`).
 */
export namespace AutoMovieHumanDigitTipCap {
  /** Station step of the search, mm. */
  const STEP: number = 0.05;

  /** A cap's fixed inputs. */
  export interface IInput {
    /** The section's mean radius `sqrt(width * depth)` at an arc length along the line, mm. */
    radius: (s: number) => number;

    /** Arc length of the digit's apex along its line, mm. */
    length: number;

    /** Arc length of the first section to search from, mm. */
    from: number;
  }

  /**
   * Arc length where the cap starts; one millimetre before the apex when the
   * radius never reaches the distance left.
   *
   * @param input The cap's inputs.
   */
  export function start(input: IInput): number {
    for (let s: number = input.from + 1; s < input.length; s += STEP) if (input.radius(s) >= input.length - s) return s;
    return input.length - 1;
  }

  /**
   * The apex: the point the line's last tangent reaches at the digit's length.
   *
   * @param at The line's point at the cap's start, mm.
   * @param tangent The line's unit tangent there.
   * @param cap Arc length of the cap's start, mm.
   * @param length Arc length of the apex, mm.
   */
  export function apex(
    at: readonly [number, number, number],
    tangent: readonly [number, number, number],
    cap: number,
    length: number,
  ): [number, number, number] {
    const d: number = length - cap;
    return [at[0] + d * tangent[0], at[1] + d * tangent[1], at[2] + d * tangent[2]];
  }
}
