# src/film/inheritProductionLighting.ts#inheritProductionLighting

## @evidence contracts/development/implementation.md#principled-implementation

An id-keyed left merge: a map from production id to resolved light replaces staged entries in place and a set of staged ids selects the sources to append, so staged order is preserved and the result is a pure function of lighting, lights, pin and time; it relies on ids being unique within each list, which scene and production validation enforce.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Story-clock mapping is `autoMovieStoryTime` and sampling is `resolveProductionLighting`, both shared; this function owns only the merge rule, which is the one decision production shot assembly needs from the engine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every light is merged by the same id rule regardless of type or source; the unchanged pass-through for a missing lighting or pin is the stated additivity contract, not a special case for a fixture.

## @evidence contracts/development/common.md#meaningful-documentation

States both pass-through conditions, the story instant evaluated, the replace and append rules with their order, how it composes with `lightMotions`, the units of `seconds` and that light objects are shared rather than copied.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in staged lights plus production sources: one map and one set built once, then one lookup per staged light and one membership test per source, after the resolver's own pass over the production clips.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call resolves one instant of one production for one shot and coordinates no work across calls; the caller evaluates it once per shot.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The map and set are dropped on return; the caller owns the returned array, bounded by staged lights plus production sources.
