import type { AutoMovieArchetypeQuadrupedGait } from "../../AutoMovieArchetypeQuadrupedGait";
import { AutoMovieArchetypeEquineGait } from "../../AutoMovieArchetypeEquineGait";

export namespace EquineIcelandicProfileData {
  /*
   * The authored even four beat sequence, continuing support across successive
   * steps.
   */
  export const TOLT: AutoMovieArchetypeQuadrupedGait.IGait = {
    ...AutoMovieArchetypeEquineGait.TABLE.gaits.walk!,
    phases: { leftFore: 0, rightFore: 0.5, leftHind: 0.75, rightHind: 0.25 },
    rows: [
      row(1.5, 659, 85, 295, 326),
      row(2, 587, 71, 262, 285),
      row(2.5, 583, 74, 264, 317),
      row(3, 571, 48, 254, 285),
      row(3.5, 538, 32, 225, 253),
      row(4, 524, 28, 210, 229),
      row(4.5, 501, 28, 194, 207),
      row(5, 486, 21, 184, 194),
      row(5.5, 479, 24, 168, 186),
      row(6, 468, 18, 157, 181),
      row(6.5, 449, 24, 138, 158),
      row(7.5, 422, 10, 119, 139),
    ],
  };

  /*
   * The flying end of measured pace. Model the near-synchronous lateral pairs
   * as coincident.
   */
  export const PACE: AutoMovieArchetypeQuadrupedGait.IGait = {
    bob: AutoMovieArchetypeEquineGait.TABLE.gaits.trot!.bob,
    nod: AutoMovieArchetypeEquineGait.TABLE.gaits.trot!.nod,
    fold: AutoMovieArchetypeEquineGait.TABLE.gaits.trot!.fold,
    lift: AutoMovieArchetypeEquineGait.TABLE.gaits.trot!.lift,
    phases: { leftFore: 0, rightFore: 0.5, leftHind: 0, rightHind: 0.5 },
    rows: [
      row(7, 444, 25, 138, 148),
      row(7.5, 431, 29, 132, 147),
      row(8, 426, 25, 125, 138),
      row(8.5, 427, 23, 128, 131),
      row(9, 399, 16, 126, 122),
      row(9.5, 400, 14, 114, 121),
      row(10, 389, 8, 113, 125),
      row(10.5, 386, 21, 110, 117),
    ],
  };

  /*
   * Convert observed milliseconds into a pure row in seconds.
   */
  export function row(
    speed: number,
    period: number,
    spread: number,
    fore: number,
    hind: number,
  ): AutoMovieArchetypeQuadrupedGait.IRow {
    return {
      speed,
      stride: period / 1_000,
      deviation: spread / 1_000,
      stance: fore / 1_000,
      hindStance: hind / 1_000,
    };
  }
}
