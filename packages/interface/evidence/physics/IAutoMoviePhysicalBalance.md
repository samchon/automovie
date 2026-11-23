# src/physics/IAutoMoviePhysicalBalance.ts#IAutoMoviePhysicalBalance

## @evidence contracts/development/design.md#principled-representation

Actual support patches form the horizontal convex hull; COM height and velocity predict a capture point independently of eventual contact outcomes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The bone id links one actual patch and endpoint to the existing footfall pattern. A step exists only for the recovery branch; shared geometric facts remain available for supported and unrecoverable assessments.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Invalid finite state/limits throw; absent hull, insufficient remaining supports or unreachable travel can refuse recovery rather than fabricate a step.

## @evidence contracts/development/common.md#meaningful-documentation

All positions are world metres; points and position serve distinct hull and endpoint roles. Members distinguish prediction from measured outcome and specify world metres, absent step and empty-hull behavior.

# src/physics/IAutoMoviePhysicalBalance.ts#IAutoMoviePhysicalBalance.IResult

## @evidence contracts/development/design.md#principled-representation

Prediction state, capture point and hull distance explain whether a reachable step is requested.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A step exists only for the recovery branch; shared geometric facts remain available for supported and unrecoverable assessments.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Recovery is a proposed endpoint, never a receipt of successful landing; an empty hull retains infinite distance.

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish prediction from measured outcome and specify world metres, absent step and empty-hull behavior.

# src/physics/IAutoMoviePhysicalBalance.ts#IAutoMoviePhysicalBalance.IAssessInput

## @evidence contracts/development/common.md#meaningful-documentation

Describes actual COM/support measurements, unavailable endpoints and finite recovery-policy bounds.

## @evidence contracts/development/design.md#principled-representation

World-metre positions and m/s velocity define the capture point with positive m/s² gravity; pattern phases break equal-distance ties.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMoviePhysicalBalance.assess reads the canonical footfall pattern and measured support patches supplied by the physical controller.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Empty support is unrecoverable; unavailable endpoints still contribute their real support patches but cannot be chosen for a step.
