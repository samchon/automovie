# src/harness/AutoMoviePropRelationKind.ts#AutoMoviePropRelationKind

## @evidence contracts/development/design.md#principled-representation

Each kind maps to an explicit list of admissible target kinds in `validatePropPlacements`' `RELATION_TARGETS` table, so whether a relation is well formed is a table lookup rather than an inference from the target.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six kinds name the distinct contacts the architecture graph can answer for, containment, support, adjacency, filling, fixing and hanging, without a free-form relation string or per-kind payload.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The one-space and one-opening limits are refusals of a contradictory claim, not a silent choice of the first relation, and no kind is accepted against a target its table omits.

## @evidence contracts/development/common.md#meaningful-documentation

Points to where targets and measurement are documented and states every refusal the validator makes about kinds, including the per-prop limits and duplicate pairs.
