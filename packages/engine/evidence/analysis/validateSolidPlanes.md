# src/analysis/validateSolidPlanes.ts#validateSolidPlanes

## @evidence contracts/development/implementation.md#principled-implementation

Compares the plane count with four, the fewest half-spaces that can bound a 3D region, then visits each index, refusing an absent record before checking its normal through `ViolationCollector.direction` and offset for finiteness; boundedness and non-emptiness of the intersection remain unchecked.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function holds the per-plane rule and writes into the caller's collector, so the context validator accumulates every violation while `assertAutoMovieAnalysisSolids` converts the same violations into a throw; the direction rule itself belongs to the collector shared with other validators.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No plane, label or caller is special-cased; the count floor is the named constant `AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES`, and nothing downstream compensates for an unbounded solid, which simply blocks wherever its half-spaces say.

## @evidence contracts/development/common.md#meaningful-documentation

Names both callers, resident-slot/count/normal/offset checks, the 1e-12 length floor, typed nested-container premise, accumulating sink, inside convention and unchecked empty/unbounded intersections.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(P) pass performs fixed scalar/vector checks per plane with constant live scratch, plus path/diagnostic text proportional to its length. No pairwise plane or enclosure solve proves boundedness; only caller-owned findings accumulate.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure check of one plane list per call; each caller passes a different solid, and no verdict exists to share between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing and opens no handle; the violations go into the caller-owned collector, whose lifetime the caller controls.
