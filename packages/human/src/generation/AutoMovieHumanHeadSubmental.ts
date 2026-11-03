import type { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The submental sheet: the skin under the chin from the gnathion back to the
 * cervical point, where it meets the neck's front. In the sagittal plane it is
 * a straight run leaving the gnathion at the lower face-throat angle (Legan
 * and Burstone 1980: the angle subnasale, gnathion, cervical point reads 100
 * degrees, 7 SD) and ending on the neck's front; in the frame of the chin it
 * is a level shelf under the border, as the reference's is. The piece owns
 * that line, its fall and the cervical point it ends at, and publishes them as
 * the jet the neck's top boundary copies; the cervicomental turn into the
 * throat is the neck base's.
 *
 * Reads: the skeleton's gnathion, subnasale and neck ring (its front place),
 * and the mandible prior's least fall and throat angle. Publishes the fall,
 * the cervical point and the underside's height at a forward place.
 */
export namespace AutoMovieHumanHeadSubmental {
  /** What the submental sheet reads. */
  export interface IInput {
    /** The landmark skeleton: the gnathion, the subnasale and the neck ring. */
    plan: Pick<IAutoMovieHumanHeadLayout, "landmarks" | "neck">;

    /** The mandible prior's least fall of the underside and the lower face-throat angle. */
    jaw: Pick<AutoMovieHumanHeadPrior.IMandible, "under" | "throatAngle">;
  }

  /**
   * The underside's fall below the horizontal, radians: the throat angle round
   * from the line up to the subnasale, never under the prior's least fall.
   * With the subnasale over the pogonion that line is about level, so the
   * underside leaves the gnathion nearly level.
   *
   * @param input What the sheet reads.
   * @returns The fall in radians, positive downward and backward.
   */
  export function fall(input: IInput): number {
    const degree: number = Math.PI / 180;
    const lm: IAutoMovieHumanHeadLayout["landmarks"] = input.plan.landmarks;
    const up: number = Math.atan2(
      lm.subnasale[1] - lm.gnathion[1],
      lm.subnasale[0] - lm.gnathion[0],
    );
    return Math.max(input.jaw.under * degree, up + input.jaw.throatAngle * degree - Math.PI);
  }

  /**
   * The cervical point, `[x, y]`: where the underside meets the neck's front,
   * the neck ring's centre plus its radius.
   *
   * @param input What the sheet reads.
   * @returns The point in the head frame, calibration millimetres.
   */
  export function cervical(input: IInput): [number, number] {
    const gn: [number, number] = input.plan.landmarks.gnathion;
    const angle: number = fall(input);
    const x: number = input.plan.neck.x + input.plan.neck.radius;
    const run: number = (gn[0] - x) / Math.cos(angle);
    return [x, gn[1] - run * Math.sin(angle)];
  }

  /**
   * Height of the underside at a forward place between the cervical point and
   * the gnathion.
   *
   * @param input What the sheet reads.
   * @param x Forward place, calibration millimetres.
   * @returns Height of the skin there, held at the gnathion's height in front of it.
   */
  export function underside(input: IInput, x: number): number {
    const gn: [number, number] = input.plan.landmarks.gnathion;
    return gn[1] - Math.max(0, gn[0] - x) * Math.tan(fall(input));
  }
}
