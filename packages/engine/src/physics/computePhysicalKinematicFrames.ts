import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import { bindPhysicalKinematicFrame } from "./bindPhysicalKinematicFrame";
import { createPhysicalKinematicFrame } from "./createPhysicalKinematicFrame";
import { preparePhysicalGeometry } from "./preparePhysicalGeometry";
import { yieldPhysicalSimulation } from "./yieldPhysicalSimulation";

/**
 * Compute authored frames and geometric relationships without constructing a dynamics world.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Compute authored frames and geometric relationships without constructing a dynamics world) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Compute authored frames and geometric relationships without constructing a dynamics world) directly over its typed inputs (`input`, `cache`, `signal`, `progress`) as nested iteration of depth 2 (map over input.bodies; for-of over input.bodies; for-of over body.profile.segments), delegating to `Math.round`, `Object.fromEntries`, `preparePhysicalGeometry`, `signal?.throwIfAborted`, `createPhysicalKinematicFrame`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One async operation of 54 lines and 5 top-level statements that reuses `Math.round`, `Object.fromEntries`, `preparePhysicalGeometry`, `signal?.throwIfAborted`, `createPhysicalKinematicFrame` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`, `cache`, `signal`, `progress`; the dominant cost is nested iteration of depth 2 (map over input.bodies; for-of over input.bodies; for-of over body.profile.segments), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Awaits 2 calls per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body awaits asynchronous work; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
 */
export async function computePhysicalKinematicFrames(
  input: Simulation.IInput,
  cache: Cache,
  signal?: AbortSignal,
  progress?: (completed: number, total: number) => void,
): Promise<void> {
  const count: number = Math.round(input.duration * input.rate);
  const profiles: Record<string, P> = Object.fromEntries(
    input.bodies.map((body: Simulation.IBody): [string, P] => [
      body.id,
      body.profile,
    ]),
  );
  for (const body of input.bodies)
    for (const segment of body.profile.segments)
      cache.ownership.push({
        body: body.id,
        bone: segment.bone,
        seconds: 0,
        kind: "authored",
      });
  const geometry:
    | Awaited<ReturnType<typeof preparePhysicalGeometry>>
    | undefined = input.bodies.some(
    (body: Simulation.IBody): boolean =>
      !!body.selfAvoidance ||
      body.targets.some(
        (target: Simulation.ITarget): boolean =>
          !!target.bindings?.length || !!target.pointBounds?.length,
      ),
  )
    ? await preparePhysicalGeometry()
    : undefined;
  for (let step: number = 0; step <= count; step++) {
    signal?.throwIfAborted();
    const frame: Cache.IFrame = createPhysicalKinematicFrame(input, step);
    cache.frames.push(
      geometry
        ? bindPhysicalKinematicFrame(
            input,
            step,
            frame,
            cache.frames.at(-1),
            geometry,
            cache.contacts,
            profiles,
          )
        : frame,
    );
    if (step % input.yieldEvery === 0 || step === count)
      await yieldPhysicalSimulation(
        step,
        count,
        input.yieldEvery,
        signal,
        progress,
      );
  }
}
