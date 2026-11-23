# src/physics/IAutoMoviePhysicalContactSupportRows.ts#IAutoMoviePhysicalContactSupportRows

## @evidence contracts/development/design.md#principled-representation

Endpoint XYZ rows remain independent of optional planted witnesses and global floor nonpenetration; explicit witnesses select equality rows without removing the original endpoint goal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalContactSupportRows shares this support description with the contact-target planner without introducing anatomical endpoint fields. physicalContactSupportRows emits the shared residual-group protocol for planPhysicalContactTargets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nonfinite floors/points, missing carriers, duplicate patch carriers and more than 64 witnesses are refused; a fitted endpoint cannot replace the original promise.

## @evidence contracts/development/common.md#meaningful-documentation

Preserves each endpoint's original XYZ promise alongside an optional explicit planted patch. Defines the profile, original support promises, scene identity and borrowed convex query lifetime.

# src/physics/IAutoMoviePhysicalContactSupportRows.ts#IAutoMoviePhysicalContactSupportRows.ISupport

## @evidence contracts/development/common.md#meaningful-documentation

Preserves each endpoint's original XYZ promise alongside an optional explicit planted patch.

## @evidence contracts/development/design.md#principled-representation

World-metre endpoint goals differ from carrier-local witnesses; a patch adds a world-Y floor and real carrier identities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalContactSupportRows shares this support description with the contact-target planner without introducing anatomical endpoint fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Patch carriers and finite witnesses require runtime checks; the fitted endpoint must not replace the original goal to hide residual error.

# src/physics/IAutoMoviePhysicalContactSupportRows.ts#IAutoMoviePhysicalContactSupportRows.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Defines the profile, original support promises, scene identity and borrowed convex query lifetime.

## @evidence contracts/development/design.md#principled-representation

All supports use the same admitted profile and world floor in metres; local witness coordinates are transformed by candidate poses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalContactSupportRows emits the shared residual-group protocol for planPhysicalContactTargets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The request carries actual declared patches, with no inferred sole; floor nonpenetration does not remove the endpoint's XYZ constraint.
