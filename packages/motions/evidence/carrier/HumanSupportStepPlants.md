# src/carrier/HumanSupportStepPlants.ts#HumanSupportStepPlants.IPlant

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and frame.

## @evidence contracts/development/design.md#principled-representation

The walk's window, the support side, the touchdown second and two world adjustments.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanSupportStep` only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The window is the walk's own, so a plant cannot disagree with the contact it declares.

# src/carrier/HumanSupportStepPlants.ts#HumanSupportStepPlants.ISurface

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and axes.

## @evidence contracts/development/design.md#principled-representation

A world frame and two extents, as the affordance declares them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read in this namespace and by `HumanSupportStep`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An undeclared extent is unbounded, never guessed.

# src/carrier/HumanSupportStepPlants.ts#HumanSupportStepPlants.IStep

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit.

## @evidence contracts/development/design.md#principled-representation

The step's context, its support motion and two heights.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `HumanSupportStep` only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The heights are the step's own, read once.

# src/carrier/HumanSupportStepPlants.ts#HumanSupportStepPlants.assign

## @evidence contracts/development/common.md#meaningful-documentation

States the support rule, the slide and the lift.

## @evidence contracts/development/implementation.md#principled-implementation

Which support bears a foot is read from the supports' declared surfaces where it lands; a slide is the least that clears the edge.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the walk's plant windows, then one sort per foot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No support speed is assumed: each support's displayed frame places its footprints.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the walk's few plants, each reading a few surfaces.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the walk's windows and leg goals.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the plants it returns.
