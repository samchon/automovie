# src/construction/IAutoMovieSolidTraceLaw.ts#IAutoMovieSolidTraceLaw.ILaw

## @evidence contracts/development/design.md#principled-representation

A scalar constraint plus its point/phase gradient, parameter derivative and second-order remainder closes the three surface-meeting equations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five callbacks separate the common Newton/predictor consumer from the selected parameter representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The interface does not validate derivative consistency or transversality; its grad(t) form assumes the point/phase-affine laws provided by the current constructors.

## @evidence contracts/development/common.md#meaningful-documentation

Names every derivative role, point-affine premise and the fact that raw residual units depend on the law.
