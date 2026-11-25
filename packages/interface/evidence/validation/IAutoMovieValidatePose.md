# src/validation/IAutoMovieValidatePose.ts#IAutoMovieValidatePose.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Admit skeleton identity, optional root transform, duplicate/undeclared joint bones and effective rig/default ROM. Member documentation states the supplied records, units and absence meanings used by validatePose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No joint-specific escape field replaces ROM admission; missing rig references and invalid angles remain findings rather than repaired poses.

## @evidence contracts/development/design.md#principled-representation

pose preserves null joint angles as rest and skeleton supplies bone identities and degree limits; optional path and collector control diagnostic ownership.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidatePose.IProps, used by validatePose. Its pose, skeleton, path, collector members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
