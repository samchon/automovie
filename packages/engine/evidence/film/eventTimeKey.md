# src/film/eventTimeKey.ts#eventTimeKey

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to Number.prototype.toFixed(6), so equal numeric inputs spell equally; rounding-bin collisions and its large-magnitude exponent branch are preserved rather than claiming arbitrary arithmetic noise is erased.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One spelling shared by `compileLaunch` and `handoffEvents`, the producers of interaction event ids, so the same instant cannot be keyed two ways.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Applies the same formatter to every event and instant; ids inherit its rounding collisions rather than receiving fixture-specific disambiguation.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the exact format with an example, why the precision is fixed, and when two keys collide.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one `toFixed` call whose output length grows only with the integer digits of the instant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure formatting of one number that coordinates nothing across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned string.
