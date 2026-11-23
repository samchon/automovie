# src/harness/IAutoMovieLookAtAction.ts#IAutoMovieLookAtAction

## @evidence contracts/development/design.md#principled-representation

aimYawPitch solves eye-to-target yaw/pitch in the actor's facing frame; gazeChainJoints shares each axis head-first then neck, leaving excess on the head for ROM refusal. Single-axis addition assumes aligned rest bases; simultaneous split rotations do not commute, so joint-range agreement is not exact world-gaze alignment. Dynamic output uses a 24 Hz bake with linear inter-key pose interpolation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One target on the shared base is the whole verb; eye height, rig range and the actor's frame come from the actor context, so no angle or joint field is exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A target with no point is refused rather than aimed at a default direction, and a prop or camera keeps its own placement as the aim point instead of an invented eye height.

## @evidence contracts/development/common.md#meaningful-documentation

States the refusals, the eye-to-eye aim and its exception, how the angles are spread, when the gaze is held or resampled, the `"auto"` length and the default region; the member says what the gaze is directed at.
