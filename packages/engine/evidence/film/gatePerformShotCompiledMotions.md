# src/film/gatePerformShotCompiledMotions.ts#gatePerformShotCompiledMotions

## @evidence contracts/development/implementation.md#principled-implementation

A region mask that drops authored content would silently change the performance, so each drop is refused at the author's field; a compiled clip must still pass its rig's motion validation, so its violations are re-rooted under the compiled node the author can find.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Structure: `compilePerformance` reports the drops and `validateMotion` owns the clip rules; this function only turns both into the shot's violations, and `performShot` stops on them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every drop and every rigged clip is checked; only a node without a rig is skipped, because it has no rig to validate against.

## @evidence contracts/development/common.md#meaningful-documentation

States both checks, each violation's path, the skipped case and the path re-rooting.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the drops plus one `validateMotion` per rigged clip, whose cost is its own.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Runs once per shot over that shot's compiled clips; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Appends to the caller's collector and retains nothing after return.
