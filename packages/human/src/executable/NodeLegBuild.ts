import { AutoMovieHumanLegBuild } from "../generation/leg/AutoMovieHumanLegBuild";

/**
 * The leg renderer's (`node:leg-specs`) and capture provider's handle on the
 * leg's generation entry (`AutoMovieHumanLegBuild`): the same inputs and
 * builds, so both draw exactly the construction the body realizes.
 */
export namespace NodeLegBuild {
  /** Everything the leg reads from the person, calibration mm. */
  export type IInputs = AutoMovieHumanLegBuild.IInputs;

  /** One complete build at a pose, with its stage timings. */
  export type IBuild = AutoMovieHumanLegBuild.IBuild;

  /** Resolve one leg's inputs from the public parameters, the trunk's hip port included. */
  export const inputs: typeof AutoMovieHumanLegBuild.inputs = AutoMovieHumanLegBuild.inputs;

  /** Build the leg at a pose. */
  export const build: typeof AutoMovieHumanLegBuild.build = AutoMovieHumanLegBuild.build;
}
