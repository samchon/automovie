# src/math/AutoMovieEngineTransform.ts#AutoMovieEngineTransform.identity

## @evidence contracts/development/common.md#meaningful-documentation

Names the three identity fields and fresh transform record.

## @evidence contracts/development/implementation.md#principled-implementation

Zero translation, a unit scalar quaternion and coordinate scales of one make every local point retain its position. Each nested component is constructed for this result.

## @evidence contracts/development/implementation.md#efficient-algorithms

One transform record owns its freshly created translation, rotation and scale records.

# src/math/AutoMovieEngineTransform.ts#AutoMovieEngineTransform.of

## @evidence contracts/development/common.md#meaningful-documentation

Names input ownership and the omitted-scale default.

## @evidence contracts/development/implementation.md#principled-implementation

The wrapper assigns the supplied fields directly. Supplying the same object preserves identity and later edits, while the default expression creates a new unit-scale record.

## @evidence contracts/development/implementation.md#efficient-algorithms

Allocate only the wrapper and, when omitted, its default scale. No transformation or validation runs.
