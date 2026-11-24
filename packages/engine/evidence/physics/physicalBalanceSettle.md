# src/physics/physicalBalanceSettle.ts#physicalBalanceSettle

## @evidence contracts/development/common.md#meaningful-documentation

States which goals it sets, how the root's strength is decided and that the input is never written.

## @evidence contracts/development/implementation.md#principled-implementation

A landed foot's goal is its landed place, held by the support solve rather than an endpoint servo (Feng et al. 2013, Section III-D); after a landing moved the root, every other limb's goal is its authored endpoint moved by its offset. The strength is `physicalBalanceExhaustion`'s or the bracing policy's (`physicalBalanceBracing`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The goals, the loss timer, then the strength.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The one cast types the null-prototype goals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the offsets and the limbs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It settles one substep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalBalanceSettle.ts#physicalBalanceSettle.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents the settled state, goals, strength and shift.

## @evidence contracts/development/design.md#principled-representation

What the controller returns, less the swing's path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by advancePhysicalBalance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shift is absent without a bracing shift.
