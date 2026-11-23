# src/construction/IAutoMovieSolidTraceLaw.ts#IAutoMovieSolidTraceLaw

## @evidence contracts/development/design.md#principled-representation

ILaw exposes a point/part-phase-affine equation and the derivatives required by implicit tracing; residual units follow phase, angle or reference-arc mode.

## @evidence contracts/development/design.md#minimal-and-owned-surface

SolidTraceLaw constructs these callbacks for intersection trace solvers using world-mm points and their declared curve clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The callback set does not certify a solved intersection or interchangeable residual scales; the selected law retains its own units.

## @evidence contracts/development/common.md#meaningful-documentation

Explains equation derivatives, second-order remainder and mode-specific angle reading.

# src/construction/IAutoMovieSolidTraceLaw.ts#IAutoMovieSolidTraceLaw.ILaw

## @evidence contracts/development/design.md#principled-representation

A scalar constraint plus its point/phase gradient, parameter derivative and second-order remainder closes the three surface-meeting equations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five callbacks separate the common Newton/predictor consumer from the selected parameter representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The interface does not validate derivative consistency or transversality; its grad(t) form assumes the point/phase-affine laws provided by the current constructors.

## @evidence contracts/development/common.md#meaningful-documentation

Names every derivative role, point-affine premise and the fact that raw residual units depend on the law.
