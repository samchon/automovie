/**
 * The host dimension a build-up is measured against.
 *
 * When passed as `host` to `validateAutoMovieMaterialAssembly` or
 * `resolveAutoMovieMaterialAssembly`, the summed layer thickness must equal
 * `thickness` within `1e-9` m; a non-finite or non-positive thickness is itself
 * reported as a violation. Omitting `host` skips the comparison.
 *
 * @author Samchon
 */
export interface IAutoMovieAssemblyHost {
  /** Nominal host thickness along the assembly's stacking axis, in metres. */
  thickness: number;
}
