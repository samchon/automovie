# src/physics/physicalBalanceUnload.ts#physicalBalanceUnload

## @evidence contracts/development/common.md#meaningful-documentation

States how an asked limb gives up its share, what decides its lift and that the input is never written.

## @evidence contracts/development/implementation.md#principled-implementation

The bearing share ramps to zero over `physicalStanceBalance.FADE`, so its force bound ramps out with it (Herzog et al. 2016, Section 5.3), and the measured load is low-passed (`physicalStanceSeat.lowPass`), the reading the lift is decided on (Pratt et al., M2V2, Section VII-A).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the limbs asked to step, one seat copy each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or special cases; an absent share defaults to one, the first stance's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the limbs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one substep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains and grows nothing.
