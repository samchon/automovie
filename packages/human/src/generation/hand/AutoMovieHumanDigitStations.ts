import type { IAutoMovieHumanDigitProfile } from "@automovie/interface";

import { AutoMovieHumanLoftStations } from "../../lofting/AutoMovieHumanLoftStations";

/**
 * Where along a digit's centre line its sections stand.
 *
 * Subdivide the general body pitch for digits and refine each narrow window by
 * its own width.
 *
 * - One section every {@link STEP} mm of the line from the first section past the
 *   web to where the tip rounds;
 * - One every {@link JOINT_STEP} mm within {@link JOINT_WINDOW} mm either side of
 *   each interphalangeal joint, so the turn of the centre line and the joint's
 *   relief window are resolved by more than one section;
 * - One every quarter of a relief's half width within each window of the
 *   profile's narrow reliefs (the palmar creases, the proximal nail fold, the
 *   plate's apex window), so each relief is read as the bump it is;
 * - The tip's three rings, close together, so the cap's sections keep the rounded
 *   end tangent.
 *
 * Counts follow from the digit's length: an adult finger of 55 to 95 mm from
 * its first section gives about 33 to 52 sections.
 */
export namespace AutoMovieHumanDigitStations {
  /**
   * ESTIMATE for narrow digits, half the general body pitch in millimetres
   * before local refinement.
   */
  export const STEP: number = AutoMovieHumanLoftStations.BODY_PITCH_MM / 2;

  /** Spacing within a joint's window, mm: half the base spacing. */
  export const JOINT_STEP: number = STEP / 2;

  /**
   * Half width of a joint's sampling window. Two base intervals leave
   * intermediate samples on both sides of the turn.
   */
  export const JOINT_WINDOW: number = 2 * STEP;

  /**
   * Stations per half width inside a relief window: a C2 window read by the
   * loft's cubic spline through samples a quarter of its half width apart keeps
   * its height to about one percent; one or two samples across a window
   * narrower than the base step turn its bump into a step.
   */
  export const RESOLVE: number = 4;

  /**
   * Halve the pitch toward the cap and subdivide the final half interval at the
   * tip.
   */
  const TIP_RINGS: readonly number[] = [STEP / 2, STEP / 8, 0];

  /**
   * The stations of one digit, increasing, from its first section to its cap.
   *
   * @param first Arc length of the first own section along the digit's line,
   *   mm.
   * @param cap Arc length where the rounded tip starts, mm.
   * @param joints Arc lengths of the digit's interphalangeal joints along the
   *   line, mm.
   * @param windows The profile's narrow reliefs along the line
   *   (`AutoMovieHumanDigitProfile.windows`), each of a positive finite half
   *   width.
   * @throws {RangeError} For a first section or cap that is not finite, a
   *   window whose half width is not positive and finite, or a station step the
   *   line's arc lengths cannot represent.
   */
  export function of(
    first: number,
    cap: number,
    joints: readonly number[],
    windows: readonly IAutoMovieHumanDigitProfile.IWindow[],
  ): number[] {
    if (!(Number.isFinite(first) && Number.isFinite(cap)))
      throw new RangeError(
        `A digit's stations need a finite first section and cap, not ${first} and ${cap} mm`,
      );
    for (const w of windows)
      if (!(Number.isFinite(w.half) && w.half > 0))
        throw new RangeError(
          `A digit's relief window at ${w.at} mm needs a positive finite half width, not ${w.half} mm`,
        );
    const out: number[] = [first];
    const last: number = cap - STEP;

    // Walk from the first section, closing the step inside a joint's window
    // and inside every relief window to a share of its half width. Every
    // step is positive, so the walk reaches the cap after at most
    // (last - first) over the least step; a step under half an ulp of the
    // arc length would leave it standing, and is refused.
    let s: number = first;
    while (s < last) {
      const near: boolean = joints.some(
        (j: number): boolean => Math.abs(s - j) <= JOINT_WINDOW,
      );
      const fine: number = windows.reduce(
        (step: number, w: IAutoMovieHumanDigitProfile.IWindow): number =>
          Math.abs(s - w.at) <= w.half + step
            ? Math.min(step, w.half / RESOLVE)
            : step,
        near ? JOINT_STEP : STEP,
      );
      if (!(s + fine > s))
        throw new RangeError(
          `A digit's station step of ${fine} mm does not advance its arc length past ${s} mm`,
        );
      s += fine;
      if (s < last) out.push(s);
    }
    for (const back of TIP_RINGS) out.push(cap - back);

    // A ring closer than a tenth of a millimetre to its neighbour adds nothing.
    return out.filter(
      (x: number, i: number): boolean => i === 0 || x > out[i - 1]! + 0.1,
    );
  }
}
