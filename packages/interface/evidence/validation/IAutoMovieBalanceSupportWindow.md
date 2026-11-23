# src/validation/IAutoMovieBalanceSupportWindow.ts#IAutoMovieBalanceSupportWindow

## @evidence contracts/development/design.md#principled-representation

The validator samples resolved joints, forms the horizontal support hull and tests a joint-mass-weighted COM proxy or the selected center bone against a metre margin; the default proxy is not a measured distributed-body COM.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Action-level contacts remain authored instead of being guessed from a generic rig or motion label.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Discrete sampling does not certify continuous balance between frames, and any declared physicsIntent suppresses balance warnings; malformed windows are separately reported as errors.

## @evidence contracts/development/common.md#meaningful-documentation

Documents seconds, metre margin default 0.02, explicit contacts and the approximation behind the default center source.
