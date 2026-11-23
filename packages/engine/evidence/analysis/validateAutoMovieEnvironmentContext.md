# src/analysis/validateAutoMovieEnvironmentContext.ts#validateAutoMovieEnvironmentContext

## @evidence contracts/development/implementation.md#principled-implementation

Accumulates violations in a `ViolationCollector`; id uniqueness and building-owned collisions are `Set` lookups, ordering compares each finite time with the previous finite one, and the horizon rule tests the sign of the dot product of the normalized sun and normalized ground up, which equals the sign of the sun's elevation and stays defined for components whose raw product would overflow.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the context rules with one private `usable` predicate that gates the horizon rule; non-blank strings, directions and the `[0, 1]` range use the shared collector checks, and occluder planes use `validateSolidPlanes`, the same rule `assertAutoMovieAnalysisSolids` applies to authored shades.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Meter units, schema version 1 and strict time order are contract rules. The shared collector rejects nonfinite measured norms before the horizon gate skips their unusable arithmetic; overflow cannot turn an invalid direction into a successful context.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states both governing rules and why ordering is not repaired, the return-not-throw behavior and `$input` root, the direction, unit, time, illuminance and humidity rules, and when the horizon rule is skipped; `reserved` states what it holds and what omission means.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time is O(R + I + O·P) for R reserved ids hashed into one set, I instants with constant work each, and O occluders of P planes; the ground up is normalized once per call rather than once per instant, and no pairwise comparison runs because uniqueness uses hashed sets.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Nothing is memoized across calls: each daylight and envelope study and each production build validates the context it is handed, with its own `reserved` set, and a cache keyed on a mutable caller object could not prove the context unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The collector, the reserved, instant and occluder sets live only for the call; the returned validation holds the violations, which may reference fragments of the context, and is owned by the caller.
