import { minimumJerk } from "@automovie/engine";

import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { createQuadruped } from "./createQuadruped";

/**
 * How a quadruped's swinging foot and its head move through a stride: the foot brought to its next landing by the minimum-jerk path, and the head's nod timed to the footfalls as its species' gait states.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it gives and from what.
 * @evidence contracts/development/design.md#principled-representation A swing's share along and up as functions of its normalised time, and the head's pitch as a function of the stride's phase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two profiles `rideQuadruped` poses with, kept apart so the ride stays readable.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The path between targets is the engine's minimum-jerk owner's, not a curve of this module's own.
 */
export namespace AutoMovieArchetypeQuadrupedMotion {
  /**
   * A swinging foot's progress at a share of its swing: along, from where it lifted to where it lands next, and up, from the ground to the swing's clearance and back.
   *
   * @param u The swing's share done, 0 to 1.
   * @returns The share of the way along and the share of the clearance up.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each share is.
   * @evidence contracts/development/implementation.md#principled-implementation The minimum-jerk lift-and-place model: the foot is brought from its lift-off to its next landing along the stride by the minimum-jerk path (`minimumJerk`, Flash and Hogan 1985), and in height by the same path in forward then reverse time. Evaluate the first half through the engine owner and use its exact symmetry s(1-t)=1-s(t) for the second half, avoiding the polynomial's cancellation near completion. No gait source read gives a swing path's shape, so this is the minimum-jerk optimum for those two targets, not a measured trajectory: the foot leaves and meets the ground at rest in both directions and passes the clearance at the middle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One stable profile along and the same profile at a symmetric lift-time coordinate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No negative-clearance clamp, numerical floor tolerance, changed target or species-specific phase patch hides endpoint overshoot; time reflection preserves the same quintic path.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's `minimumJerk`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function swing(u: number): { along: number; rise: number } {
    return {
      along: progress(u),
      rise: progress(2 * Math.min(u, 1 - u)),
    };
  }

  /**
   * The head's pitch at a phase of a stride, degrees, positive nose-down, by half the gait's pitch range either side, timed as the gait's `nod.timing` states.
   *
   * @param species The species.
   * @param stride The stride's gait and lead.
   * @param phase The stride's phase, from the left fore's landing.
   * @param duty The duty factor at the speed, the share of the stride a foot is planted.
   * @returns The pitch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the sign and the three timings.
   * @evidence contracts/development/implementation.md#principled-implementation `support`: the head and neck pitch nose-up in the latter part of each forelimb's support, so the nose is highest as each fore lifts off and lowest half a step before, twice a stride; `bob`: nose-down as the trunk sinks, twice a stride; `lead`: retraction, nose-up, from the leading forelimb's touchdown and protraction, nose-down, late in the airborne phase, so the nose is lowest at that touchdown, once a stride. The three are Dunbar et al. 2008's (J Exp Biol 211:3889) horse walk, trot and canter; a species states which it uses per gait.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cosine per timing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieArchetypeQuadrupedGait.phase` for the leading fore's landing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function nod(
    species: createQuadruped.ISpecies,
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

/** Sample the existing quintic by its first-half value and exact time symmetry. */
function progress(u: number): number {
  return u <= 0.5 ? minimumJerk(u).s : 1 - minimumJerk(1 - u).s;
}
