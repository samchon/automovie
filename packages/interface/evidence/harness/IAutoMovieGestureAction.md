# src/harness/IAutoMovieGestureAction.ts#IAutoMovieGestureAction

## @evidence contracts/development/design.md#principled-representation

Reference synthesis routes point/strike through right-arm reachPose and fixed extension/jab envelopes, using a 24 Hz bake plus envelope landmarks when the target is a bone or a live actor frame is supplied. Other kinds use gestureMotion's fixed stops or return null when unsupported; sampled target poses do not prove continuous contact between keys.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A kind, an optional note and an optional target are the whole gesture; timing comes from the shared base and the motion from the engine, so no keyframe or joint field is exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `reachPose` extends the arm toward a far target but never clamps joint angles into the rig's ranges, so an impossible pose fails the range-of-motion gate instead of being hidden, and `note` is never parsed to choose different motion.

## @evidence contracts/development/common.md#meaningful-documentation

States the intent-only contract, the arm, target and refusal rules of `point` and `strike`, their hold and snap shapes, the `"auto"` length, and where per-kind coverage is listed; members say who reads `note` and which kinds read `at`.
