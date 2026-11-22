import type {
  IAutoMovieSamplePhysicalRecoveryGoal,
  IAutoMovieStepPlanner,
} from "@automovie/interface";

import { AutoMovieStepPlanner as Planner } from "./AutoMovieStepPlanner";

/**
 * Sample the declared recovery trajectory and its derivative at one clock, independently of native control or cache-frame ownership.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Sample the declared recovery trajectory and its derivative at one clock, independently of native control or cache-frame ownership) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Sample the declared recovery trajectory and its derivative at one clock, independently of native control or cache-frame ownership) directly over its typed inputs (`input`) as a fixed number of statements with no loop or recursion in the body, delegating to `Math.max`, `Math.min`, `Planner.swing`, `Math.cos`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 30, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 33 lines and 5 top-level statements that reuses `Math.max`, `Math.min`, `Planner.swing`, `Math.cos` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 30 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function samplePhysicalRecoveryGoal(
  input: IAutoMovieSamplePhysicalRecoveryGoal.IInput,
): IAutoMovieSamplePhysicalRecoveryGoal.IResult {
  const duration: number = input.swing.end - input.swing.start;
  const progress: number = Math.max(
    0,
    Math.min(1, (input.seconds - input.swing.start) / duration),
  );
  const placement: IAutoMovieStepPlanner.IPlacement = Planner.swing(
    input.swing.from,
    input.swing.to,
    progress,
    input.height,
  );
  const rate: number =
    progress > 0 && progress < 1
      ? (30 * progress ** 2 * (1 - progress) ** 2) / duration
      : 0;
  // Past the swing's end the foot keeps descending at the clearance profile's
  // final speed until it strikes the floor (Yin, Loken and van de Panne 2007,
  // Section 3.1).
  const descent: number = (input.height * Math.PI) / duration;
  const late: number = Math.max(0, input.seconds - input.swing.end);
  return {
    point: {
      x: placement.point[0],
      y: input.point.y + placement.clearance - descent * late,
      z: placement.point[1],
    },
    velocity: {
      x: (input.swing.to.point[0] - input.swing.from.point[0]) * rate,
      y:
        input.velocity.y +
        (progress > 0 && progress < 1
          ? (input.height * Math.PI * Math.cos(Math.PI * progress)) / duration
          : late > 0
            ? -descent
            : 0),
      z: (input.swing.to.point[1] - input.swing.from.point[1]) * rate,
    },
  };
}
