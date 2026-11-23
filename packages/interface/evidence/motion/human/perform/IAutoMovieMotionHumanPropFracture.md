# src/motion/human/perform/IAutoMovieMotionHumanPropFracture.ts#IAutoMovieMotionHumanPropFracture.IRequest

## @evidence contracts/development/common.md#meaningful-documentation

Names the placed prop, recorded hit, model and local budget units. The model splits deterministically or returns null to keep the prop intact.

## @evidence contracts/development/design.md#principled-representation

The exact hit id and its target disambiguate placement. The budget goes directly to the model's declared split.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanPerformance resolves the event target and reads the prop frame. The model owns piece generation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No geometry inference or test-dependent outcome is encoded in the request.

# src/motion/human/perform/IAutoMovieMotionHumanPropFracture.ts#IAutoMovieMotionHumanPropFracture.IPlaced

## @evidence contracts/development/common.md#meaningful-documentation

States the piece identity, its preserved model type and its world frame.

## @evidence contracts/development/design.md#principled-representation

A concrete model and one world transform are sufficient to place each sampled piece.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanPerformance publishes instances from the fracture plan's sampler.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No extra model or body representation is introduced.

# src/motion/human/perform/IAutoMovieMotionHumanPropFracture.ts#IAutoMovieMotionHumanPropFracture.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

States when replacement pieces become visible and what the sampler returns before the contact.

## @evidence contracts/development/design.md#principled-representation

One canonical interaction event anchors the returned frame function on the film clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The scene consumes the event and sampled replacement. All trajectory construction stays in the planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No change to collision geometry or independent timeline is implied by this staging result.
