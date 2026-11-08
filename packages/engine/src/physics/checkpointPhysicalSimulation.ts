import type { AutoMoviePhysicalSimulation } from "./AutoMoviePhysicalSimulation";
import type { AutoMoviePhysicalSimulationInput } from "./AutoMoviePhysicalSimulationInput";
import { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";

/** An unchanged prefix is established from actual data, never from an edit-time assertion. */
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
