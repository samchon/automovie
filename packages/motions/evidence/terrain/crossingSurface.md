# src/terrain/crossingSurface.ts#crossingSurface.IExtent

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.

## @evidence contracts/development/design.md#principled-representation

Signed coordinates in the crossing frame; left is below right and near below far.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The five values the gap and vault planners read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Read from one placed surface, never authored.

# src/terrain/crossingSurface.ts#crossingSurface.read

## @evidence contracts/development/common.md#meaningful-documentation

States the result and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Transforms the affordance centre and its two in-plane axes into the frame; the normal must be within about 2.6 degrees of up (cosine 0.999) and the axes within 3 cm per metre, about 1.7 degrees, of the frame's (provisional tolerances).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission first, then one transform of three points.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a surface it cannot represent instead of approximating it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the prop's affordances for the lookup, constant after.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/terrain/crossingSurface.ts#crossingSurface.refusal

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and result.

## @evidence contracts/development/implementation.md#principled-implementation

One refusal kind and fix for every crossing geometry refusal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds one record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names the actual parameter and value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
