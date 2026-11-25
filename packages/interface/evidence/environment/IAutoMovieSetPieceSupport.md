# src/environment/IAutoMovieSetPieceSupport.ts#IAutoMovieSetPieceSupport

## @evidence contracts/development/design.md#principled-representation

A staged node, a closed verdict union, a signed gap in metres and the chosen support's id. The verdict adds `wall-borne` and `declared` to the building sweep's vocabulary, because a hung furnishing piece and a prop judged by placement validation are neither resting nor floating. The gap's sign convention is the building support result's: positive above, negative sunk.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The engine function `environmentSupportReport` produces it and `IAutoMovieEnvironment.support` carries it to authors and tests. It reuses the building result's verdict names instead of introducing synonyms.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It does not extend `IAutoMovieBuiltSupportResult.status`, whose consumers judge one authored relation; the report declares its own union. Gap and support are null exactly where no measurement or candidate exists.

## @evidence contracts/development/common.md#meaningful-documentation

States each verdict's condition, the gap's units, sign and null cases, and the kinds of support id.