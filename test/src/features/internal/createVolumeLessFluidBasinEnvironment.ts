import type { IAutoMovieBuiltEnvironment, IAutoMovieBuiltSpace } from "@automovie/interface";
import { basinEnvironment } from "./basinEnvironment";

/** Preserve the original semantic-only basin fixture by removing its cells;
 * the owning binding case independently expects volume-less geometry to skip
 * containment even for an outside domain. Every space record is fresh, and no
 * validation or renderer runs while this helper constructs source data. */
export function createVolumeLessFluidBasinEnvironment(): IAutoMovieBuiltEnvironment {
  const environment: IAutoMovieBuiltEnvironment = basinEnvironment();
  return {
    ...environment,
    spaces: environment.spaces.map((space: IAutoMovieBuiltSpace): IAutoMovieBuiltSpace => ({ ...space, cells: [] })),
  };
}
