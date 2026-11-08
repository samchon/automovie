import type { AutoMoviePhysicalSimulation } from "./AutoMoviePhysicalSimulation";
import type { AutoMoviePhysicalSimulationInput } from "./AutoMoviePhysicalSimulationInput";
import { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";

/**
 * An unchanged prefix is established from actual data, never from an edit-time assertion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (An unchanged prefix is established from actual data, never from an edit-time assertion) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (An unchanged prefix is established from actual data, never from an edit-time assertion) directly over its typed inputs (`input`, `previous`) as nested iteration of depth 2 (map over value.bodies; for loop bounded by step <= first; map over input.bodies), delegating to `JSON.stringify`, `strip`, `Math.max`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 57 lines and 6 top-level statements that reuses `JSON.stringify`, `strip`, `Math.max` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`, `previous`; the dominant cost is nested iteration of depth 2 (map over value.bodies; for loop bounded by step <= first; map over input.bodies), performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function checkpointPhysicalSimulation(
  input: AutoMoviePhysicalSimulation.IInput,
  previous?: AutoMoviePhysicalSimulation,
): number {
  if (!previous || previous.cache.protocol !== Cache.protocol) return 0;
  const strip: (value: AutoMoviePhysicalSimulation.IInput) => string = (
    value: AutoMoviePhysicalSimulationInput.IInput,
  ): string =>
    JSON.stringify({
      ...value,
      impulses: [],
      bodies: value.bodies.map(
        (body: (typeof value.bodies)[number]): object => ({
          ...body,
          targets: [],
        }),
      ),
    });
  if (strip(input) !== strip(previous.input)) return 0;
  let first: number = input.duration * input.rate;
  for (let step: number = 0; step <= first; step++) {
    if (
      JSON.stringify(
        input.bodies.map(
          (
            body: (typeof input.bodies)[number],
          ): AutoMoviePhysicalSimulation.ITarget => body.targets[step]!,
        ),
      ) !==
        JSON.stringify(
          previous.input.bodies.map(
            (
              body: (typeof previous.input.bodies)[number],
            ): AutoMoviePhysicalSimulation.ITarget => body.targets[step]!,
          ),
        ) ||
      JSON.stringify(
        input.impulses.filter(
          (impulse: (typeof input.impulses)[number]): boolean =>
            impulse.step === step,
        ),
      ) !==
        JSON.stringify(
          previous.input.impulses.filter(
            (impulse: (typeof previous.input.impulses)[number]): boolean =>
              impulse.step === step,
          ),
        )
    ) {
      first = step;
      break;
    }
  }
  return Math.max(
    0,
    ...[...previous.cache.checkpoints.keys()].filter(
      (step: number): boolean => step < first,
    ),
  );
}
