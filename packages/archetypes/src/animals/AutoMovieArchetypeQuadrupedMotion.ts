import {
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";

import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/** Evaluates normalized foot swing and the stride's authored head pitch. */
export namespace AutoMovieArchetypeQuadrupedMotion {
  /**
   * Evaluates a foot's normalized progress between lift-off and landing.
   *
   * @param u Elapsed share of the swing, in [0, 1].
   * @returns Minimum-jerk forward progress and a clearance share that reaches
   *   one at mid-swing and returns to zero at landing.
   * @throws {RangeError} If `u` falls outside the closed interval.
   */
  export function swing(u: number): { along: number; rise: number } {
    if (!(u >= 0 && u <= 1))
      throw new RangeError("A quadruped swing share must be within [0, 1]");
    return {
      along: progress(u),
      rise: progress(2 * Math.min(u, 1 - u)),
    };
  }

  /**
   * Evaluates head pitch in degrees, positive nose-down, around neutral.
   *
   * Support timing peaks nose-up at lift-off. Bob timing peaks nose-up at
   * left fore landing. Lead timing peaks nose-down at the selected fore's
   * landing. Each travels within half of the gait's stated pitch range.
   *
   * @param species Gait table supplying pitch range and timing mode.
   * @param stride Gait and lead for the stride being evaluated.
   * @param phase Normalized phase from the left forefoot's landing.
   * @param duty Planted share of the stride for support timing.
   * @returns The signed pitch at that phase.
   * @throws {AutoMovieArchetypeRefusal} If the species has no such gait.
   */
  export function nod(
    species: AutoMovieArchetypeQuadruped.ISpecies,
    stride: AutoMovieArchetypeQuadrupedGait.IStride,
    phase: number,
    duty: number,
  ): number {
    const head: AutoMovieArchetypeQuadrupedGait.IGait["nod"] =
      AutoMovieArchetypeQuadrupedGait.of(species, stride.gait).nod;
    const half: number = head.range / 2;
    if (head.timing === "support")
      return -half * Math.cos(4 * Math.PI * (phase - duty));
    if (head.timing === "bob") return -half * Math.cos(4 * Math.PI * phase);
    const leading: number = AutoMovieArchetypeQuadrupedGait.phase(
      species,
      stride,
      stride.lead === "left" ? "leftFore" : "rightFore",
    );
    return half * Math.cos(2 * Math.PI * (phase - leading));
  }
}

/*
 * Sample the existing quintic by its first-half value and exact time symmetry.
 */
function progress(u: number): number {
  return u <= 0.5 ? AutoMovieEngineMotionSampling.minimumJerk(u).s : 1 - AutoMovieEngineMotionSampling.minimumJerk(1 - u).s;
}
