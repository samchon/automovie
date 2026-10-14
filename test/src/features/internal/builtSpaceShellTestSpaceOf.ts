import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
} from "@automovie/interface";

/** Resolve a known logical space by its authored identifier.
 *
 * Resolve the existing fixture's known logical-space record by id. Constructing or locating this fixture alone is not a product behavior proof; its consumers own assertions.
 * Exact authored id equality selects the first record; the nonnull assertion premises a declared fixture id and supplies no independent ownership oracle.
 * Consumers request the named hall/root records; absence is outside this fixture helper's contract and is tested through actual product refusal seams elsewhere.
 */
export const builtSpaceShellTestSpaceOf: (environment: IAutoMovieBuiltEnvironment, id: string) => IAutoMovieBuiltSpace = (
  environment: IAutoMovieBuiltEnvironment,
  id: string,
): IAutoMovieBuiltSpace =>
  environment.spaces.find((candidate: IAutoMovieBuiltSpace): boolean => candidate.id === id)!;
