# src/tasks/useToolPose.ts#useToolPose

## @evidence contracts/development/common.md#meaningful-documentation

States what it builds from the plan's prepared values and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The hand's working pose on the tool for the work's kind: the arm's bend solved to the grip with the tool held toward the work (`posed`), forward for a hammer or a screwdriver, downward for stirring, and along the stroke for a saw.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `useTool.plan`: its `pose`, built from what that plan prepared, apart from the plan's other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `useTool.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called once per plan where `useTool.plan` built it before; its cost is the moved code's, and any reader it returns evaluates as it did.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the plan's prepared values instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what the returned value holds, for as long as the plan holds it.

# src/tasks/useToolPose.ts#useToolPose.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the plan value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `useTool.plan` prepared before its `pose`, each typed as that plan declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `useToolPose.of` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.
