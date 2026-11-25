# src/construction/IAutoMovieConicArcField.ts#IAutoMovieConicArcField.IGeometry

## @evidence contracts/development/design.md#principled-representation

The normalized positive native velocity fixes orientation independently of its speed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two pairs separate position from unit direction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Higher source tangent partials are internal algebra outputs, not required physical derivatives.

## @evidence contracts/development/common.md#meaningful-documentation

Point uses source length units; tangent is dimensionless.

# src/construction/IAutoMovieConicArcField.ts#IAutoMovieConicArcField.IReading

## @evidence contracts/development/design.md#principled-representation

Only point source order two and unit-tangent source order one feed the geometric radial lift.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One reading exposes the exact derivative orders its consumer needs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Tangent Hessians are neither fabricated as zero nor required finite.

## @evidence contracts/development/common.md#meaningful-documentation

Point entries use [value,s,p,ss,sp,pp]; tangent entries use [value,s,p]; radial uses [rho,rho_phi,rho_phiphi].

# src/construction/IAutoMovieConicArcField.ts#IAutoMovieConicArcField.IFailure

## @evidence contracts/development/design.md#principled-representation

A failed finite-input or required-output premise remains explicit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One discriminator and detail identify failure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing derivatives are never silently zeroed or sent to a legacy shape.

## @evidence contracts/development/common.md#meaningful-documentation

Detail names the failed fixed-clock source premise.
