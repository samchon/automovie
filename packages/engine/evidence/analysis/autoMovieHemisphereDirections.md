# src/analysis/autoMovieHemisphereDirections.ts#autoMovieHemisphereDirections

## @evidence contracts/development/implementation.md#principled-implementation

A stratified radial coordinate `(index + 0.5) / count` paired with the base-2 van der Corput angle (a Hammersley set), lifted by Malley's disk-to-hemisphere projection so density follows the cosine, in Duff et al.'s branchless orthonormal basis; the radical inverse reads the index as a 32-bit unsigned integer, which is exact because a JavaScript array cannot hold 2^32 entries, and a non-finite normal is refused because it would turn every direction into NaN.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns sampling, with the radical inverse as its only private helper; it depends only on the normal and the count, which lets the daylight analyzer build the set once per study.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No pole is special-cased, since choosing `sign` from `normal.z` keeps `sign + normal.z` away from zero; the half-sample radial offset is the stratification, not a correction for a measured result.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the sequence and mapping, determinism across hosts, where the estimator is exact and where it carries error, normalization of `normal`, every throwing input, and the unbounded memory.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) time and memory for N=count: radical inversion reads at most 32 unsigned index bits per direction. The basis is computed once, followed by two square roots and a sine-cosine pair per direction; oversized counts may fail host allocation before completion.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The daylight analyzer builds the set once per study and shares it across every grid cell, which is valid because the set depends only on the plane normal and `diffuseSamples`, both fixed for the study.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one new array of N vectors owned by the caller and retains nothing; N is the caller's `diffuseSamples`, which nothing caps beyond being a safe integer, so that allocation has no bound.
