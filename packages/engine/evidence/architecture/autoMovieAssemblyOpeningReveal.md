# src/architecture/autoMovieAssemblyOpeningReveal.ts#autoMovieAssemblyOpeningReveal

## @evidence contracts/development/implementation.md#principled-implementation

Measures the maximal runs of wrapping layers from each face, because only a contiguous run from a face can turn the jamb corner, and subtracts twice their summed thickness from each structural dimension; the trailing run is capped so a fully wrapping build-up is not counted twice.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass from each end of the resolved layer list and a single subtraction, with the result shape owned by `IAutoMovieAssemblyReveal`; layer resolution stays with `resolveAutoMovieMaterialAssembly`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no assembly or material; an unreachable wrapping flag is ignored by measuring runs rather than special-cased, and a consumed or non-finite opening is refused rather than clamped to zero.

## @evidence contracts/development/common.md#meaningful-documentation

States the structural-versus-finished reading, the doubling of the inset, how each lining depth is measured, the bare jamb, the refusal and why it catches `NaN`, the unvalidated-flag case, the fully wrapping case, the metre units, and every throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the layer count: one scan from each end, each run summed in layer order, and one list of lining ids.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure computation over one resolved assembly and one opening that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned reveal, whose layer list is bounded by the assembly's layer count.
