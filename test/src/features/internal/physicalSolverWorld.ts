import { AutoMovieEngineXpbdWorld } from "@automovie/engine";
import type { IAutoMoviePhysicalSimulationInput } from "@automovie/interface";

/**
 * An empty solver world configured from an input's explicit settings the
 * way `AutoMovieEnginePhysicalSimulation.compute` configures its own: gravity,
 * the substep `1 / (rate * substeps)` seconds, `contactTolerance` as the
 * allowed contact error and `contactFrequency`. A case that steps a world by hand states
 * every one of these settings, so a missing one throws instead of falling
 * back to a default the case never declared.
 *
 * @param input The case's input, with every solver setting explicit.
 * @returns A world with no bodies.
 */
export function physicalSolverWorld(
  input: IAutoMoviePhysicalSimulationInput.IInput,
): AutoMovieEngineXpbdWorld {
  if (
    input.substeps === undefined ||
    input.contactTolerance === undefined ||
    input.contactFrequency === undefined
  )
    throw new Error("A hand-stepped solver world needs explicit settings");
  const world: AutoMovieEngineXpbdWorld = new AutoMovieEngineXpbdWorld(input.gravity);
  world.timestep = 1 / (input.rate * input.substeps);
  world.allowedError = input.contactTolerance;
  world.contactFrequency = input.contactFrequency;
  return world;
}
