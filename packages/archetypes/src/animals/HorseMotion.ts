import { minimumJerk } from "@automovie/engine";

import type { HorseGait } from "./HorseGait";
import { rideHorse } from "./rideHorse";

/**
 * How a horse's swinging hoof and its head move through a stride: the hoof brought to its next landing by the minimum-jerk path, and the head's nod timed to the footfalls as it was measured.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it gives and from what.
 * @evidence contracts/development/design.md#principled-representation A swing's share along and up as functions of its normalised time, and the head's pitch as a function of the stride's phase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two profiles `rideHorse` poses with, kept apart so the ride stays readable.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The path between targets is the engine's minimum-jerk owner's, not a curve of this module's own.
 */
export namespace HorseMotion {
  /** The head's pitch range in a stride, degrees, by gait: 9 at walk, 5 at trot and 10 at canter, the head's pitch displacement relative to space (Dunbar et al. 2008, J Exp Biol 211:3889, Table 1, https://pmc.ncbi.nlm.nih.gov/articles/PMC2768006). The gallop reuses the canter's; no measured value was found. */
  export const NOD: Readonly<Record<HorseGait.Gait, number>> = {
    walk: 9,
    trot: 5,
    canter: 10,
    gallop: 10,
  };

  /**
   * A swinging hoof's progress at a share of its swing: along, from where it lifted to where it lands next, and up, from the ground to the swing's clearance and back.
   *
   * @param u The swing's share done, 0 to 1.
   * @returns The share of the way along and the share of the clearance up.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each share is.
   * @evidence contracts/development/implementation.md#principled-implementation The minimum-jerk lift-and-place model: the hoof is brought from its lift-off to its next landing along the stride by the minimum-jerk path (`minimumJerk`, Flash and Hogan 1985), and in height by two such paths, lift-off to the apex at the swing's middle and the apex to touchdown, the apex the swing's clearance (`rideHorse.LIFT`, a named estimate no source read gives). No gait source read gives a horse's swing path's shape, so this is the minimum-jerk optimum for those two targets, not a measured trajectory: the hoof leaves and meets the ground at rest in both directions and passes the clearance at the middle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One profile along, two halves up.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's `minimumJerk`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function swing(u: number): { along: number; rise: number } {
    return {
      along: minimumJerk(u).s,
      rise: u < 0.5 ? minimumJerk(2 * u).s : 1 - minimumJerk(2 * u - 1).s,
    };
  }

  /**
   * The head's pitch at a phase of a stride, degrees, positive nose-down, by half the gait's measured range either side.
   *
   * @param stride The stride's gait and lead.
   * @param phase The stride's phase, from the left fore's landing.
   * @param duty The duty factor at the speed, the share of the stride a hoof is planted.
   * @returns The pitch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the sign and the timing by gait and its source.
   * @evidence contracts/development/implementation.md#principled-implementation Dunbar et al. 2008 time the nod to the footfalls: at the walk the head and neck pitch on the trunk as one, rotating nose-up in the latter part of each forelimb's support, so the nose is highest as each fore lifts off and lowest half a step before; at the canter retraction, nose-up, begins at the leading forelimb's touchdown and protraction, nose-down, in the late airborne phase, so the nose is lowest at that touchdown. At the trot the head bobs slightly as the body rises and falls (pitch "so small as to be insignificant" in their Fig. 9B); its nose-down as the trunk sinks is a provisional reading of that sentence. The gallop is timed as the canter, on its leading fore.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cosine per gait family.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The gallop borrows the canter's timing and range, and the trot's sign is provisional; both are stated.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `rideHorse.phase` for the leading fore's landing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function nod(
    stride: rideHorse.IStride,
    phase: number,
    duty: number,
  ): number {
    const half: number = NOD[stride.gait] / 2;
    if (stride.gait === "walk")
      return -half * Math.cos(4 * Math.PI * (phase - duty));
    if (stride.gait === "trot") return -half * Math.cos(4 * Math.PI * phase);
    const leading: number = rideHorse.phase(
      stride,
      stride.lead === "left" ? "leftFore" : "rightFore",
    );
    return half * Math.cos(2 * Math.PI * (phase - leading));
  }
}
