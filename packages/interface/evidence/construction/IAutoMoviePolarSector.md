# src/construction/IAutoMoviePolarSector.ts#IAutoMoviePolarSector.IGuide

## @evidence contracts/development/design.md#principled-representation

Value, first derivative and second derivative at one polar angle supply the endpoint data of a quintic sector.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four scalar fields keep the interpolation boundary independent of the source conic or seam that produced it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record does not prove positive radius, ordered angles or conic origin; those are producer premises.

## @evidence contracts/development/common.md#meaningful-documentation

Names radians and both angular derivative orders; radius units follow the owning section, normally mm.

# src/construction/IAutoMoviePolarSector.ts#IAutoMoviePolarSector.Jet

## @evidence contracts/development/design.md#principled-representation

The three-tuple carries rho, rho-prime and rho-double-prime for analytic polar-to-Cartesian differentiation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Positional derivative order matches the radius and point readers without another stateful object.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tuple itself performs no finite-value, positivity or curvature validation.

## @evidence contracts/development/common.md#meaningful-documentation

States derivative order and units relative to the section radius.
