# src/terrain/climbStairsCarry.ts#climbStairsCarry

## @evidence contracts/development/common.md#meaningful-documentation

States the per-footprint rule, the swing, the root and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A floor plant is the identity; a tread plant is the prop's rigid motion from the plan's start to the later of the second and its touchdown (`HumanSupportCarry.of`); a swing and the root blend the two carries (`HumanSupportCarry.blend`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read each foot's plants, then carry the root and each leg goal by its own rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A floor print is never carried, so a grounded foot does not slide with the prop.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per leg per sample: a scan of the foot's few plants and at most two carries.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each sample carries its own plan posture.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the plan and its plant lists.
