import { AutoMovieGravity } from "@automovie/engine";

import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * A line walk's footprints along its line (`lineWalk`): heel to toe, and the
 * sag a walker's weight needs of a line slung between two ends.
 */
export namespace lineWalkFootprints {
  /*
   * A slung line's working load, newtons (provisional: a rigged slackline).
   */
  export const LOAD: number = 15000;

  /*
   * A line walk's footprints.
   */
  export interface IPace {
    /*
     * The steps, a foot's length each by default.
     */
    steps: number;

    /*
     * Each step along the line, signed, metres.
     */
    step: number;
  }

  /*
   * Pace a line walk heel to toe: by default enough foot lengths to cover the
   * way along the line, at least one.
   * Parameter start: Where the walk starts along the line, metres.
   * Parameter stop: Where it stops along the line, metres.
   * Parameter foot: The walker's foot length, metres.
   * Parameter asked: The steps asked, if any.
   * Returns: The steps and each step.
   * When the steps are no whole number.
   */
  export function pace(
    start: number,
    stop: number,
    foot: number,
    asked: number | undefined,
  ): IPace {
    const steps: number =
      asked ?? Math.max(1, Math.ceil(Math.abs(stop - start) / foot));
    HumanBound.whole("steps", steps);
    return { steps, step: (stop - start) / steps };
  }

  /*
   * Admit a sagging line: the walker's weight at the middle needs a tension `W
   * L / (4 sag)`, refused beyond the line's working load `LOAD`.
   * Parameter mass: The walker's mass, kilograms.
   * Parameter half: Half the line's length, metres; infinite for no ends.
   * Parameter sag: The line's sag, metres.
   * When the tension exceeds the working load.
   */
  export function sagged(mass: number, half: number, sag: number): void {
    if (!(sag > 0 && half < Infinity)) return;
    const tension: number =
      (mass * AutoMovieGravity.STANDARD * 2 * half) / (4 * sag);
    if (tension > LOAD) {
      const least: number =
        (mass * AutoMovieGravity.STANDARD * 2 * half) / (4 * LOAD);
      throw new HumanRefusal({
        kind: "parameter",
        axis: "sag",
        value: sag,
        feasible: { kind: "range", minimum: least, maximum: null, unit: "m" },
        reason: `a ${(2 * half).toFixed(1)} m line sagging ${sag} m needs ${(tension / 1000).toFixed(1)} kN, beyond its ${LOAD / 1000} kN working load`,
        fix: `let it sag at least ${least.toFixed(2)} m, or shorten the span`,
      });
    }
  }
}
