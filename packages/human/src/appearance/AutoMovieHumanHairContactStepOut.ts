import { AutoMovieHumanShoulderField } from "./AutoMovieHumanShoulderField";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { IAutoMovieHumanHairSettled } from "./IAutoMovieHumanHairSettled";

/**
 * A strand point too deep or too steep to lift onto the body steps out
 * horizontally down the surface's gradient, a millimetre at a time up to
 * three steps, to the first column it clears by `clearance`; lifting a
 * strand up a wall would make it climb the body instead of hanging beside
 * it. The millimetre pitch and the three-step reach are conventions of this
 * prototype.
 */
export namespace AutoMovieHumanHairContactStepOut {
  /**
   * Step a point out to the first clear column.
   *
   * @param shoulders Body surface heights
   * @param centre The head chart's centre, model millimetres
   * @param next Candidate point, head-local millimetres
   * @param at The point in model millimetres
   * @param gradient The surface gradient `[dh/dx, dh/dz]` and its magnitude
   * @param normal The surface normal
   * @param clearance Distance from the skin, millimetres
   * @param step Guide step, millimetres
   * @returns The point stepped out, or null when no clear column is found
   */
  export function out(
    shoulders: AutoMovieHumanShoulderField.IField,
    centre: AutoMovieHumanSkinVector.Vec3,
    next: AutoMovieHumanSkinVector.Vec3,
    at: AutoMovieHumanSkinVector.Vec3,
    gradient: [number, number, number],
    normal: AutoMovieHumanSkinVector.Vec3,
    clearance: number,
    step: number,
  ): IAutoMovieHumanHairSettled | null {
    const [gx, gz, g]: [number, number, number] = gradient;
    if (g < 1e-9) return null;

    const dx: number = -gx / g;
    const dz: number = -gz / g;
    for (let d: number = 1; d <= 3 * step; d += 1) {
      const hx: number = at[0] + dx * d;
      const hz: number = at[2] + dz * d;
      const below: number = AutoMovieHumanShoulderField.height(
        shoulders,
        hx,
        hz,
      );
      if (at[1] >= below + clearance)
        return { point: [hx - centre[0], next[1], hz - centre[2]], normal };
    }
    return null;
  }
}
