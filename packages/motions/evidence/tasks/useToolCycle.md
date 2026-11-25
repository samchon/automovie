# src/tasks/useToolCycle.ts#useToolCycle

## @evidence contracts/development/common.md#meaningful-documentation

States what it builds from the plan's prepared values and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The hand at a phase of the work, 0 at a contact and periodic in 1: a hammer's head rising about the wrist and coming down on the work, a saw's teeth running a quarter of the forearm either way of the work point (Starke and Baber 2017, experiment 5), and each other kind's own stroke.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `useTool.plan`: its `cycle`, built from what that plan prepared, apart from the plan's other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `useTool.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called once per plan where `useTool.plan` built it before; its cost is the moved code's, and any reader it returns evaluates as it did.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the plan's prepared values instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what the returned value holds, for as long as the plan holds it.

# src/tasks/useToolCycle.ts#useToolCycle.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the plan value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `useTool.plan` prepared before its `cycle`, each typed as that plan declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `useToolCycle.of` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.

# src/tasks/useToolCycle.ts#useToolCycle.PlanCycle

## @evidence contracts/development/common.md#meaningful-documentation

Names a shape `useTool.plan` and its parts share.

## @evidence contracts/development/design.md#principled-representation

The alias `PlanCycle` names the plan's own shape; its units and frames are those of the members it is built from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `useTool.plan` and the parts cut from it.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

An alias of existing types; it adds no shape of its own.

# src/tasks/useToolCycle.ts#useToolCycle.PlanTurn

## @evidence contracts/development/common.md#meaningful-documentation

Names a shape `useTool.plan` and its parts share.

## @evidence contracts/development/design.md#principled-representation

The alias `PlanTurn` names the plan's own shape; its units and frames are those of the members it is built from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `useTool.plan` and the parts cut from it.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

An alias of existing types; it adds no shape of its own.
