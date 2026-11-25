# src/floor/lieDownPosedAt.ts#lieDownPosedAt

## @evidence contracts/development/common.md#meaningful-documentation

States what it builds from the plan's prepared values and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The route's posture at key `index` and share `u` toward the next key: the keys' pitch and roll interpolated and the joints from the prepared blend, the root at the origin, and on the last key turned about the body's long axis toward the roll side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `lieDown.plan`: its `posedAt`, built from what that plan prepared, apart from the plan's other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `lieDown.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called once per plan where `lieDown.plan` built it before; its cost is the moved code's, and any reader it returns evaluates as it did.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the plan's prepared values instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what the returned value holds, for as long as the plan holds it.

# src/floor/lieDownPosedAt.ts#lieDownPosedAt.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the plan value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `lieDown.plan` prepared before its `posedAt`, each typed as that plan declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `lieDownPosedAt.of` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.
