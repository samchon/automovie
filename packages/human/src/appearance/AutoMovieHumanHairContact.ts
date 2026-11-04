import { AutoMovieHumanHairContactLie } from "./AutoMovieHumanHairContactLie";
import { AutoMovieHumanHairContactStepOut } from "./AutoMovieHumanHairContactStepOut";
import type { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { AutoMovieHumanShoulderField } from "./AutoMovieHumanShoulderField";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { IAutoMovieHumanHairSettled } from "./IAutoMovieHumanHairSettled";

/**
 * Where a hair strand meets the body below the head: it settles on the
 * shoulder field's upper surface (lying on it, or stepping out beside it)
 * and, once there, rests along it (`AutoMovieHumanHairContactDescent`).
 *
 * The body is a height field, so an overhang or a surface facing down is not
 * represented; a strand never climbs it. Everything works in the head
 * chart's frame (head-local millimetres, `AutoMovieHumanHeadField`) and reads
 * the surface through `AutoMovieHumanShoulderField`, so it follows whatever
 * body the generator makes.
 */
export namespace AutoMovieHumanHairContact {
  /**
   * Settle a strand point against the body below the head: on the gentle
   * surface (`AutoMovieHumanHairContactLie`), else stepped out beside the
   * steep one (`AutoMovieHumanHairContactStepOut`).
   *
   * @param field Head chart, for the model offset
   * @param shoulders Body surface heights
   * @param next Candidate point, head-local millimetres
   * @param clearance Distance from the skin, millimetres
   * @param step Guide step, millimetres
   * @param resting Whether the strand already rests on the body
   * @returns The settled point, or null when no clear point is found
   */
  export function settle(
    field: AutoMovieHumanHeadField.IField,
    shoulders: AutoMovieHumanShoulderField.IField,
    next: AutoMovieHumanSkinVector.Vec3,
    clearance: number,
    step: number,
    resting: boolean,
  ): IAutoMovieHumanHairSettled | null {
    const [cx, cy, cz]: AutoMovieHumanSkinVector.Vec3 = field.centre;
    const x: number = next[0] + cx;
    const y: number = next[1] + cy;
    const z: number = next[2] + cz;
    const h: number = AutoMovieHumanShoulderField.height(shoulders, x, z);
    if (h === -Infinity) return { point: next, normal: null };

    // The field's slope under the point decides between lying on it and
    // stepping out beside it.
    const [gx, gz]: [number, number] = AutoMovieHumanShoulderField.gradient(
      shoulders,
      x,
      z,
    );
    const g: number = Math.hypot(gx, gz);
    const normal: AutoMovieHumanSkinVector.Vec3 =
      AutoMovieHumanSkinVector.normalize([-gx, 1, -gz]);
    return (
      AutoMovieHumanHairContactLie.lie(
        next,
        y,
        h,
        g,
        normal,
        clearance,
        step,
        resting,
      ) ??
      AutoMovieHumanHairContactStepOut.out(
        shoulders,
        field.centre,
        next,
        [x, y, z],
        [gx, gz, g],
        normal,
        clearance,
        step,
      )
    );
  }
}
