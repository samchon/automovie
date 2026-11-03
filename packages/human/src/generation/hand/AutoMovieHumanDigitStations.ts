/**
 * Where along a digit's centre line its sections stand.
 *
 * The reference's bone-normal sections of f1's digits stand every 1.9 mm
 * (39 to 52 per finger, 51 on the thumb); a digit with fewer sections than
 * its reference has lost curves the reference holds, so the rule here keeps
 * the reference's density, derived from the digit's own bones and not copied
 * from any person:
 *
 * - one section every {@link STEP} mm of the line from the first section past
 *   the web to where the tip rounds, the reference's spacing;
 * - one every {@link JOINT_STEP} mm within {@link JOINT_WINDOW} mm either side
 *   of each interphalangeal joint, so the turn of the centre line and the
 *   joint's relief window are resolved by more than one section;
 * - the tip's three rings, close together, so the cap's sections keep the
 *   rounded end tangent.
 *
 * Counts follow from the digit's length: an adult finger of 55 to 95 mm from
 * its first section gives about 33 to 52 sections.
 */
export namespace AutoMovieHumanDigitStations {
  /** Spacing of a digit's sections along its line, mm: the reference's own spacing of 1.9 mm, rounded. */
  export const STEP: number = 2;

  /** Spacing within a joint's window, mm: half the base spacing. */
  export const JOINT_STEP: number = 1;

  /**
   * Half width of a joint's window, mm: about half of the half-length over
   * which the line turns (the elbow's rule scaled to the joint, 0.9 of its
   * radius, near 8 mm for a finger's PIP), a convention of the hand's joints.
   */
  export const JOINT_WINDOW: number = 4;

  /** Where the first tip rings stand before the cap, mm: the cap's last 1.2, 0.3 and 0. */
  const TIP_RINGS: readonly number[] = [1.2, 0.3, 0];

  /**
   * The stations of one digit, increasing, from its first section to its cap.
   *
   * @param first Arc length of the first own section along the digit's line, mm.
   * @param cap Arc length where the rounded tip starts, mm.
   * @param joints Arc lengths of the digit's interphalangeal joints along the line, mm.
   */
  export function of(first: number, cap: number, joints: readonly number[]): number[] {
    const out: number[] = [first];
    const last: number = cap - 2.5;

    // Walk from the first section, closing the step inside a joint's window.
    let s: number = first;
    while (s < last) {
      const near: boolean = joints.some((j: number): boolean => Math.abs(s - j) <= JOINT_WINDOW);
      s += near ? JOINT_STEP : STEP;
      if (s < last) out.push(s);
    }
    for (const back of TIP_RINGS) out.push(cap - back);

    // A ring closer than a tenth of a millimetre to its neighbour adds nothing.
    return out.filter((x: number, i: number): boolean => i === 0 || x > out[i - 1]! + 0.1);
  }
}
