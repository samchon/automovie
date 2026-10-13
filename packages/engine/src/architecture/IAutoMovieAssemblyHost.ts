/**
 * The host dimension a build-up is measured against.
 *
 * When passed as `host` to `validateAutoMovieMaterialAssembly` or
 * `resolveAutoMovieMaterialAssembly`, the summed layer thickness must equal
 * `thickness` within `1e-9` m; a non-finite or non-positive thickness is itself
 * reported as a violation. Omitting `host` skips the comparison.
 *
 * @evidence contracts/common.md#principled-implementation A single nominal thickness compared with the layer sum within `1e-9` m, which is floating-point slack rather than a construction tolerance.
 * @evidence contracts/common.md#clear-and-simple-design A one-field record so the optional `host` argument says what its number is, thickness along the stacking axis, instead of passing a bare number.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No host kind such as wall, slab or roof is treated differently; the `1e-9` m slack is the validator's only allowance.
 * @evidence contracts/common.md#meaningful-documentation States the axis and unit, the comparison and its slack, that an invalid thickness is reported, and what omitting the host does.
 * @evidenceExclude contracts/performance.md#cost-and-resources A single thickness number owned by whichever caller passes it, feeding one subtraction during validation.
 * @author Samchon
 */
export interface IAutoMovieAssemblyHost {
  /** Nominal host thickness along the assembly's stacking axis, in metres. */
  thickness: number;
}
