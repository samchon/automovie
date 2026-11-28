# src/core/AutoMovieArchetypeBand.ts#AutoMovieArchetypeBand.metres

## @evidence contracts/development/common.md#meaningful-documentation

Names metre endpoints, source, provisional flag and endpoint refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Fixes the unit to metres and sends the same inclusive endpoints to the shared factory. Its result and refusals therefore follow the finite band contract.

## @evidence contracts/development/implementation.md#efficient-algorithms

Delegates once and creates the same single band record as the general entry.

# src/core/AutoMovieArchetypeBand.ts#AutoMovieArchetypeBand.of

## @evidence contracts/development/common.md#meaningful-documentation

States finite inclusive endpoints, equal bounds, source and the optional provisional marker.

## @evidence contracts/development/implementation.md#principled-implementation

Checks finiteness before comparing the endpoints and accepts equal bounds. The returned interval keeps the exact provided unit, source and bounds. Only an explicit true adds the provisional marker.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs constant work, stores four fields and adds the marker only for the authored provisional case.

# src/core/AutoMovieArchetypeBand.ts#AutoMovieArchetypeBand.TYPICAL_MASS

## @evidence contracts/development/common.md#meaningful-documentation

Names the common estimate label and tells producers to set the provisional marker.
