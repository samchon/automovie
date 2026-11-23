# src/architecture/validateBuiltBoundaries.ts#validateBuiltBoundaries

## @evidence contracts/development/implementation.md#principled-implementation

A boundary encloses one space or separates two, so its space count is bounded by that topology; a face is usable only when its rigid frame, thickness and outline are all valid, which is decided by whether any violation was added while checking it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The boundary section of `validateBuiltEnvironment`, separated so that file stays one orchestration; it returns exactly what the opening checks consume and reuses the shared id, reference, outline and region rules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No boundary kind is special-cased, and a defective face is left out of the returned map rather than repaired, so a void on it is not also reported as leaving it.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states every boundary and face rule, the path root, and what each returned value holds and why.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B + R + sum(Vi²)) for B boundaries, R authored references and face outline sizes Vi, including finite/area scans and pairwise simplicity checks. No fixed small outline size is assumed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per building validation; its id set and face map are reused by every opening.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned set and map, each bounded by the boundary count; nothing else is retained.
