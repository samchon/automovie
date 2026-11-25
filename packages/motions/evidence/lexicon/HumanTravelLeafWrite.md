# src/lexicon/HumanTravelLeafWrite.ts#HumanTravelLeafWrite

## @evidence contracts/development/common.md#meaningful-documentation

States what it builds from the plan's prepared values and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The shown posture with the opening arm held on the handle and its digits closing as the hand takes it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `HumanTravelLeaf.openDoor`'s plan, built from what that plan prepared, apart from the plan's other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanTravelLeaf.openDoor`'s plan; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called once per plan where `HumanTravelLeaf.openDoor`'s plan built it before; its cost is the moved code's, and any reader it returns evaluates as it did.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the plan's prepared values instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what the returned value holds, for as long as the plan holds it.
# src/lexicon/HumanTravelLeafWrite.ts#HumanTravelLeafWrite.Write

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the plan value it carries.

## @evidence contracts/development/design.md#principled-representation

The signature the plan's `write` was declared with.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the factory and `HumanTravelLeaf.openDoor`'s plan only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value or one reader signature; no optional combination arises.
# src/lexicon/HumanTravelLeafWrite.ts#HumanTravelLeafWrite.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the plan value it carries.

## @evidence contracts/development/design.md#principled-representation

The values the plan prepared before its `write`, each typed as the plan declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the factory and `HumanTravelLeaf.openDoor`'s plan only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value or one reader signature; no optional combination arises.
