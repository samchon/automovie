# src/motion/human/everyday/IAutoMovieMotionHumanGestureStroke.ts#IAutoMovieMotionHumanGestureStroke.Kind

## @evidence contracts/development/common.md#meaningful-documentation

States the two families of gesture and where `bow` is handled; the namespace doc describes each gesture's goal.

## @evidence contracts/development/design.md#principled-representation

A closed union of the communicative gestures supported; `gestureStrokeTables.RHYTHM` and `gestureStrokeTables.HANDS` are total records over it, so every kind has a timing and a hand count by type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here and read by the gesture law's parameters, the capture cases, the gesture verdicts and the CI breath and gaze test that walks the tables.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Variation enters as table rows keyed by the union and exhaustive switches, not as per-gesture members.

# src/motion/human/everyday/IAutoMovieMotionHumanGestureStroke.ts#IAutoMovieMotionHumanGestureStroke.FaceRegion

## @evidence contracts/development/common.md#meaningful-documentation

States which gesture names it and that its members are the head's surface regions.

## @evidence contracts/development/design.md#principled-representation

A closed union whose every member is a humanoid surface region name, so a value is always a region the body's surfaces define and `touch` passes it straight to the region lookup.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here and read by the gesture law's `region` parameter and `IInput`; the region names themselves are owned by the interface package's region union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Narrows the interface's region union to the head instead of redeclaring regions; `pushGlasses` and `scratchHead` choose their own regions and ignore it.

# src/motion/human/everyday/IAutoMovieMotionHumanGestureStroke.ts#IAutoMovieMotionHumanGestureStroke.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Each field states its role, unit or frame, and the gesture that reads it.

## @evidence contracts/development/design.md#principled-representation

The posture is the instant's world posture the goals are built in; the target is a world point in metres; the extent is a dimensionless multiplier; a missing target for `point` is refused when the goal is built.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here and built by the gesture law once per hand per instant; body, posture, hand side and region types are imported from their owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Remaining violation: `side` is written by the gesture law but read by no stroke, since `hand` takes the side as its own parameter; the member can go in a follow-up.

# src/motion/human/everyday/IAutoMovieMotionHumanGestureStroke.ts#IAutoMovieMotionHumanGestureStroke.IHand

## @evidence contracts/development/common.md#meaningful-documentation

Each field states its role, unit and frame, and the curl's absent meaning (no extra flexion).

## @evidence contracts/development/design.md#principled-representation

An effector goal: a named hand surface, a world point in metres and a world rotation from rest, the form the shared hand solver takes; the shape and surface are closed unions from HumanHand.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here and read by the gesture law, which turns it into a hand request; surface, shape and rotation types are imported from their owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `curl` is optional because only the beckon flexes the fingers over its shape; every other field is always set, so no combination is meaningless.
