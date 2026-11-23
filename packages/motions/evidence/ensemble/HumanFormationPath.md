# src/ensemble/HumanFormationPath.ts#HumanFormationPath.lay

## @evidence contracts/development/common.md#meaningful-documentation

States the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Piecewise-constant acceleration by the engine profile; arc length on the polyline; a linear corner blend of the heading along the shortest arc.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, cut the path, lay the profile, return a reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unreachable stop or overlapping marks refuse with their numbers, never clamp.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in corners and marks once; a read scans the stretches, a handful.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller keeps one laid frame per formation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the stretches and the profile for as long as the reader is held.
