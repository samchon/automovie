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
 * Compute authored frames and geometric relationships without a dynamics world.
 * Any coupled groups and their report sink come from the same intake.
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
