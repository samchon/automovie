# src/pose/IAutoMovieResolveCenterOfMass.ts#IAutoMovieResolveCenterOfMass.IModel

## @evidence contracts/development/common.md#meaningful-documentation

Defines the total kilogram mass and segment population used for posed COM and momentum calculations.

## @evidence contracts/development/design.md#principled-representation

Segment masses and local centres describe a rigid mass model; the total must agree with the intended physical profile.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieCenterOfMass constructs this model from a canonical physical profile, and resolveAutoMovieMomentum reuses its inertia information.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Humanoid bone identities match the pose vocabulary; the record does not estimate anatomy or validate arbitrary mass data on assignment.

# src/pose/IAutoMovieResolveCenterOfMass.ts#IAutoMovieResolveCenterOfMass.ISegment

## @evidence contracts/development/common.md#meaningful-documentation

Documents the bone-rest-frame COM and principal inertia orientation needed after posing.

## @evidence contracts/development/design.md#principled-representation

Kilogram mass, metre local point, kg m² principal moments and principal-to-rest quaternion retain one segment's physical properties.

## @evidence contracts/development/design.md#minimal-and-owned-surface

COM and momentum readers share these profile-derived segment values rather than maintaining separate inertia catalogues.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller must keep bone identity and rest frames coherent with the pose; no density or inertia is guessed from the bone name.
