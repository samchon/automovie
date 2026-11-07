import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import { bindPhysicalKinematicFrame } from "./bindPhysicalKinematicFrame";
import { createPhysicalKinematicFrame } from "./createPhysicalKinematicFrame";
import { preparePhysicalGeometry } from "./preparePhysicalGeometry";
import { yieldPhysicalSimulation } from "./yieldPhysicalSimulation";

/** Compute authored frames and geometric relationships without constructing a dynamics world. */
export async function computePhysicalKinematicFrames(
  input: Simulation.IInput,
  cache: Cache,
  signal?: AbortSignal,
  progress?: (completed: number, total: number) => void,
): Promise<void> {
  const count: number = Math.round(input.duration * input.rate);
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
