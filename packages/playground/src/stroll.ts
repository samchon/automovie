import type { IAutoMovieMotion } from "@automovie/interface";
import { travelMotion } from "@automovie/engine";
import { walk } from "./walk";

/**
 * Bake six cycles of the one-second authored walk along local +Z at 0.62 metres per second, yielding a six-second non-looping travel clip. Velocity is a conventional choreography input rather than observed walking speed or verified no-slip ground contact.
 *
 * @evidence contracts/common.md#principled-implementation Canonical travelMotion repeats the base keys and adds velocity times global seconds to each root, transferring seam easing and carrying the base-period stride clock.
 * @evidence contracts/common.md#clear-and-simple-design One named travel wrapper sets the current cycle count/velocity and delegates timeline/root baking to the engine rather than integrating another locomotion model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored speed does not prove physiology, contact or component ROM, and no world-facing assumption replaces the motion's receiving frame.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies six cycles, seconds, non-looping output, local forward axis and conventional metre-per-second velocity.
 * @evidence contracts/performance.md#efficient-algorithms A five-key base and six-cycle O(CK) bake produce twenty-five keys after seam removal; sampling/FK and rendering retain their actual consumer costs.
 * @evidence contracts/performance.md#reuse-equivalent-work All six cycles reuse one supplied walk's articulation while travelMotion creates each placed root and carries one stride clock; calls do not share mutable output clips.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned travel keys/roots belong to the caller and borrow local base joints; there is no running simulation, timer or GPU allocation in this wrapper.
 *
 * @author Samchon
 */
export const stroll: (sk: string) => IAutoMovieMotion = (sk: string): IAutoMovieMotion =>
  travelMotion("stroll", walk(sk), 6, { x: 0, y: 0, z: 0.62 });
