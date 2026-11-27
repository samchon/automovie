import {
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";

import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/**
 * How a quadruped's swinging foot and its head move through a stride: the foot
 * brought to its next landing by the minimum-jerk path, and the head's nod
 * timed to the footfalls as its species' gait states.
 *
 * Public only so the package's specs can reach it: it is not part of the
 * authoring surface, and it moves to an internal subpath when one exists.
 */
export namespace AutoMovieArchetypeQuadrupedMotion {
  /**
   * A swinging foot's progress at a share of its swing: along, from where it
   * lifted to where it lands next, and up, from the ground to the swing's
   * clearance and back.
   *
   * @param u The swing's share done, 0 to 1.
   * @returns The share of the way along and the share of the clearance up.
   * @throws {RangeError} When the share lies outside the swing interval.
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
   * The head's pitch at a phase of a stride, degrees, positive nose-down, by
   * half the gait's pitch range either side, timed as the gait's `nod.timing`
   * states.
   *
   * @param species The species.
   * @param stride The stride's gait and lead.
   * @param phase The stride's phase, from the left fore's landing.
   * @param duty The duty factor at the speed, the share of the stride a foot is
   *   planted.
   * @returns The pitch.
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
