import type { IAutoMovieBuiltEnvironment, IAutoMovieBuiltSpace } from "@automovie/interface";


/** Resolve a known logical space by its authored identifier. */
export const builtSpaceShellTestSpaceOf = (
  environment: IAutoMovieBuiltEnvironment,
  id: string,
): IAutoMovieBuiltSpace =>
  environment.spaces.find((candidate) => candidate.id === id)!;
