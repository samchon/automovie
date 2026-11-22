import type {
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicsCache,
  IAutoMoviePreparePhysicalGeometry,
} from "@automovie/interface";

import type { IPhysicalCoupledTargetRun } from "./IPhysicalCoupledTargetRun";
import { bindPhysicalKinematicFrame } from "./bindPhysicalKinematicFrame";
import { createPhysicalKinematicFrame } from "./createPhysicalKinematicFrame";
import { preparePhysicalGeometry } from "./preparePhysicalGeometry";
import { yieldPhysicalSimulation } from "./yieldPhysicalSimulation";

/**
 * Compute authored frames and geometric relationships without a dynamics
 * world. Any coupled groups and their report sink come from the same intake.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names authored frame ownership and the optional admitted coupling context.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the existing output clock and authored frame producer, then resolves geometric relationships and groups on that frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Each iteration binds the next frame before appending it to the cache.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An explicitly coupled target reaches admission even if its bindings are absent, and bind failures occur before frame publication.
 * @evidence contracts/development/implementation.md#efficient-algorithms Initializes geometry once when the scene has any geometric relationship or explicit group.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the same profiles and convex query owner for the entire kinematic run.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The frame writer borrows its run cache and report sink, and acquires no dynamics world.
 */
export async function computePhysicalKinematicFrames(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  cache: IAutoMoviePhysicsCache,
  signal?: AbortSignal,
  progress?: (completed: number, total: number) => void,
  coupling?: IPhysicalCoupledTargetRun,
): Promise<void> {
  const count: number = Math.round(input.duration * input.rate);
  const profiles: Record<string, IAutoMoviePhysicalProfile> =
    Object.fromEntries(
      input.bodies.map(
        (
          body: IAutoMoviePhysicalSimulationInput.IBody,
        ): [string, IAutoMoviePhysicalProfile] => [body.id, body.profile],
      ),
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
    | Awaited<Promise<IAutoMoviePreparePhysicalGeometry.IQueries>>
    | undefined = input.bodies.some(
    (body: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
      !!body.selfAvoidance ||
      body.targets.some(
        (target: IAutoMoviePhysicalSimulationInput.ITarget): boolean =>
          !!target.bindings?.length ||
          !!target.pointBounds?.length ||
          target.coupledGroup !== undefined,
      ),
  )
    ? await preparePhysicalGeometry()
    : undefined;
  for (let step: number = 0; step <= count; step++) {
    signal?.throwIfAborted();
    const frame: IAutoMoviePhysicalFrame = createPhysicalKinematicFrame(
      input,
      step,
    );
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
            coupling,
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
