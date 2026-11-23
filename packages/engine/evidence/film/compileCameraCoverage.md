# src/film/compileCameraCoverage.ts#compileCameraCoverage

## @evidence contracts/development/implementation.md#principled-implementation

Reuses the hero take's framing grammar with the covering camera as the parameter, and derives the intent list from the same entries the move compiles, so the clip's spans and the intent records correspond one to one by construction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A thin assembler: `compileCameraMove` owns the path, `performShot` owns building the entries, and this function only pairs the clip with its intents under the covering camera's id, which keeps coverage and hero takes on one solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no camera or move; the coverage camera goes through the same solve as the hero with no special path, and absent lens intent is left as the entries state it rather than filled in here.

## @evidence contracts/development/common.md#meaningful-documentation

States what a coverage take is, which camera parameterizes the solve, the intent order and its non-use by the solve, the entry precondition, the empty case and the errors passed through.

## @evidence contracts/development/implementation.md#efficient-algorithms

One `compileCameraMove` call with the take's aspect and delivery rate, whose cost is answered there, plus one linear pass over the entries for the intents.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per coverage camera per shot with that camera's own entries, so no two calls compute the same take.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned take references the entries' intent records and a fresh clip, both owned by the caller.
