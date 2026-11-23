# src/physics/IAutoMovieProjectile.ts#IAutoMovieProjectile

## @evidence contracts/development/design.md#principled-representation

The three vectors supply p(t)=origin+velocity*t+gravity*t*t/2 when no drag is given; the drag record is the quadratic drag law's four quantities and the attitude a closed union of how a body turns in flight.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One launch-state record is sufficient for sampling; it stores no per-frame trajectory, and the integrated flight is the reader's memo, keyed by this record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Acceleration is constant and may be arbitrary finite direction, not necessarily -Y gravity; homing and collision response stay outside this representation (`projectileContinue` starts a new flight after a contact).

## @evidence contracts/development/common.md#meaningful-documentation

Members state world units, finite-vector premise, constant acceleration and what drag and attitude change.

# src/physics/IAutoMovieProjectile.ts#IAutoMovieProjectile.IDrag

## @evidence contracts/development/common.md#meaningful-documentation

Members give the drag law's quantities, SI units, numeric premises and density default.

## @evidence contracts/development/design.md#principled-representation

Cd, reference area, mass and fluid density determine the quadratic force; finite non-negative coefficients and area, positive mass and valid density remain numeric runtime premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four quantities projectileAt consumes, with the shared air density used when absent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every coefficient belongs to the caller's body and fluid; the record names no projectile or fixture.

# src/physics/IAutoMovieProjectile.ts#IAutoMovieProjectile.Attitude

## @evidence contracts/development/common.md#meaningful-documentation

States the three attitudes, body-axis convention, angular-rate unit, launch frame and identity defaults.

## @evidence contracts/development/design.md#principled-representation

A discriminated union separates velocity alignment, body-axis constant spin and fixed launch orientation; finite rates, non-zero axes and unit quaternions remain numeric premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectileAt reads these three supported rotation laws from the shared flight record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Variant-specific axis and rate fields cannot be attached to a fixed or velocity attitude; no independent trajectory is stored.
