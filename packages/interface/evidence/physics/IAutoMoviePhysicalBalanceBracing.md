# src/physics/IAutoMoviePhysicalBalanceBracing.ts#IAutoMoviePhysicalBalanceBracing

## @evidence contracts/development/design.md#principled-representation

The actual support hull determines the closest correction while measured COM height and exhaustion jointly control effort withdrawal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalBalanceBracing consumes the existing balance assessment; the provider owns the standing-recovery envelope. physicalBalanceBracing returns a new displacement to advancePhysicalBalance without writing body poses or applying forces.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Invalid height/travel policies throw; a failed step alone cannot withdraw effort and a correction request does not prove regained balance.

## @evidence contracts/development/common.md#meaningful-documentation

Separates measured COM and hull geometry from the provider's recovery-height and travel policy. Explains when strength becomes zero and why shift is only motor-target intent.

# src/physics/IAutoMoviePhysicalBalanceBracing.ts#IAutoMoviePhysicalBalanceBracing.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Separates measured COM and hull geometry from the provider's recovery-height and travel policy.

## @evidence contracts/development/design.md#principled-representation

World metres and a dimensionless exhaustion flag determine a horizontal target correction with a nonnegative metre bound.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalBalanceBracing consumes the existing balance assessment; the provider owns the standing-recovery envelope.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A failed step alone cannot withdraw effort: exhaustion and the measured height limit must both apply.

# src/physics/IAutoMoviePhysicalBalanceBracing.ts#IAutoMoviePhysicalBalanceBracing.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Explains when strength becomes zero and why shift is only motor-target intent.

## @evidence contracts/development/design.md#principled-representation

rootStrength is zero or one; shift is a world-axis metre displacement with zero Y, capped by maximumRootShift.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalBalanceBracing returns a new displacement to advancePhysicalBalance without writing body poses or applying forces.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No outside-hull correction yields zero shift, and requesting the correction does not prove balance was regained.
