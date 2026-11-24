# src/physics/physicalBalanceSense.ts#physicalBalanceSense

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, that every reading is a function of the input alone, which readings are computed at once and which on demand, and that a reading depending on the state takes that part as an argument.

## @evidence contracts/development/implementation.md#principled-implementation

The mass centre and its velocity are the mass-weighted sums of the segments' centres and their velocities; the root segment is the one no joint has as its child; a limb's load is its supports' normal impulse over the substep; its endpoints are the declared local point at its authored and actual poses (`physicalSupportPoint`); its footprint is its contact shapes' outline (`physicalSupportFootprint`) at its planted pose moved by its offset, or at its present pose while it is unseated, with the endpoint's floor point when no shape reaches the floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One builder returning the readings every phase shares, so no phase reads a body or a support list on its own.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-null assertions read segments and limbs the profile and the policy declare; the footprint's floor point is the stated fallback for a limb with no shape at the floor.

## @evidence contracts/development/implementation.md#efficient-algorithms

The mass centre is one pass over the segments; every other reading is computed when asked for, a scan of the limbs, the supports or one foot's sole vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The readings are of one substep's bodies and are rebuilt each substep; within a substep the mass centre, computed once, is the only shared value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing beyond the returned readings, which die with the substep.

# src/physics/physicalBalanceSense.ts#physicalBalanceSense.ILimb

## @evidence contracts/development/common.md#meaningful-documentation

Names one supporting limb of the policy's pattern.

## @evidence contracts/development/design.md#principled-representation

An alias of the interface's own limb type, so the policy owns it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used by the balance phases to type the limbs they read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It declares no copy of the limb.

# src/physics/physicalBalanceSense.ts#physicalBalanceSense.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Documents each input with its units and frame.

## @evidence contracts/development/design.md#principled-representation

The subset of the controller's input the readings depend on, the supports already collected.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read by a reading or carried to the phases through the readings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No any, casts or index signatures beyond the authored placements' record by bone.

# src/physics/physicalBalanceSense.ts#physicalBalanceSense.ISense

## @evidence contracts/development/common.md#meaningful-documentation

Documents each reading, its units and what it is read from.

## @evidence contracts/development/design.md#principled-representation

The input extended with the mass centre, the root segment and functions for the per-limb readings, so a reading is computed only when a phase asks for it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each member is read by at least one phase.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The state-dependent readings take the state's parts as arguments instead of capturing a state, so a phase's reads stay explicit.
