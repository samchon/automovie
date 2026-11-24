# src/physics/physicalBipedTouchdown.ts#physicalBipedTouchdown

## @evidence contracts/development/common.md#meaningful-documentation

States the foot switches' update, the reset at a swing's start, the landing rule, the full contact at landing, the held capture point, the push recovery's reset and the timed-out failure, each with its IHMC source.

## @evidence contracts/development/implementation.md#principled-implementation

IHMC's biped landing: every foot switch updates each controller update (develop `WrenchBasedFootSwitch`, as the controller toolbox updates them), a new swing's switch resets on its first update (201903 `SingleSupportState.onEntry` l.79-83), and the swing lands past 0.15 s with its switch hit (201903 `SingleSupportState.isDone` l.62-71, `WalkingSingleSupportState` l.409-417). 201903 has no touchdown duration nor toe-load ramp (`WalkingControllerParameters` l.340-343, l.360-363) and sets both feet flat on the transfer to standing (`TransferToStandingState` l.79), so the landed foot is seated fully borne. The hold projects the centre of mass onto the support shrunk by 0.08 m (`BalanceManager` l.265, l.815-829). The switches use a world-aligned frame, distances being frame-invariant; the first update of a swing is the substep after its start.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The switches, then the landing or the failure; the landing's writes are the shared `physicalBalanceTouchdown.land`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The two constants are the reference's, cited at their declarations. One non-null assertion reads the swing's switch, written in the loop over every limb.

## @evidence contracts/development/implementation.md#efficient-algorithms

One footprint and switch per limb per substep, and one support hull at a landing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one substep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the switches are one record per limb in the caller's state.

# src/physics/physicalBipedTouchdown.ts#physicalBipedTouchdown

## @evidence contracts/development/common.md#meaningful-documentation

Documents the two constants with their sources.

## @evidence contracts/development/design.md#principled-representation

The minimum swing time, seconds, and the hold's shrink distance, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by the phase.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Constants only.
