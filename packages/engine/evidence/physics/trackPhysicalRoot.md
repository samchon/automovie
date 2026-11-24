# src/physics/trackPhysicalRoot.ts#trackPhysicalRoot

## @evidence contracts/development/common.md#meaningful-documentation

States what the root tracker realizes, which pure functions compute the demand and which effects it applies.

## @evidence contracts/development/implementation.md#principled-implementation

The demand is the servo's (`physicalRootServo`), the stance's or the mass centre's task (`physicalRootDemand`) and its transitions (`physicalRootTransitions`); under internal actuation the task is set on the world for the motors' whole-body solve (the strict support cascade, Herzog et al. 2016), otherwise the external wrench is applied to the root. The replay suite (test_physical_balance_replay) shows the split tracker sets the same task, integral and diagnostics as before it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function computes through the pure functions and applies their results; the stance moment, the swinging hip's torque and the task's submission are its own.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts; non-null assertions read the body's segments and root order, which the binding builds for every body, and the balance pattern under internal actuation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the segments and the supports' points; the diagnostic split is computed only at the cache's instants.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call realizes one substep's demand.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The world owns the root task, replaced each substep; the binding's support wrench record grows by one entry per cache instant, owned by the binding.

# src/physics/trackPhysicalRoot.ts#trackPhysicalRoot.moment

## @evidence contracts/development/common.md#meaningful-documentation

States the moment's parts and that a swing hip's demand is carried whole.

## @evidence contracts/development/implementation.md#principled-implementation

tau_stance = -tau_torso - tau_swing (Yin, Loken and van de Panne 2007, Section 3.2; Pratt et al., M2V2, Sections VII-D2 and VII-E4), the supports bearing the trunk's servo and each swinging hip's torque.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or special cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the swinging hips.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/trackPhysicalRoot.ts#trackPhysicalRoot.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Documents each input with its units and owner.

## @evidence contracts/development/design.md#principled-representation

The pre-integration state the endpoint and joint controllers share, with the recovery's seating, integral and trace.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by trackPhysicalWorld; every member is read by the tracker or the functions it calls.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No any or casts; the seating repeats the recovery state's seat fields it reads.
