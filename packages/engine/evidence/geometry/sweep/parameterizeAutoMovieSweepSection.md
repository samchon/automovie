# src/geometry/sweep/parameterizeAutoMovieSweepSection.ts#parameterizeAutoMovieSweepSection

## @evidence contracts/development/implementation.md#principled-implementation

The standard closed-curve evaluations: superellipse quadrants by their power-of-cosine form, the uniform cubic B-spline basis, the cubic Bernstein basis and linear interpolation along a polygon's sides, each split into equal parameter spans per segment.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One parameterization serves both correspondence modes: the direction sampler brackets polar angles along it and parameter correspondence samples it directly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Out-of-range numbers are refused rather than clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States the parameter range and wrapping, the split per kind, where `k / n` lands, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Validation is O(n) once; each evaluation is constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The returned closure is the reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains the section, released with it.
