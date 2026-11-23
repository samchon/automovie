# src/production/IAutoMovieStorySyncPoint.ts#IAutoMovieStorySyncPoint

## @evidence contracts/development/design.md#principled-representation

The synchronization evaluator retains the exact shot/event operand and finite realized local seconds, then applies the owning shot's affine story pin to obtain story seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Nullable local and story fields distinguish absent realization from absent pin or mapped overflow without inventing a second event identity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unavailable operands are retained in declared order rather than skipped; a null time cannot become zero and accidentally satisfy simultaneity.

## @evidence contracts/development/common.md#meaningful-documentation

Defines exact operand identities, local versus story-second units and missing-realization, missing-pin or overflow null meaning.
