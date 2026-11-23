# src/motion/human/climbing/IAutoMovieMotionHumanWallClimb.ts#IAutoMovieMotionHumanWallClimb

## @evidence contracts/development/common.md#meaningful-documentation

States the initial support, move order and owner of reach admission.

## @evidence contracts/development/design.md#principled-representation

A complete four-limb starting stance and an ordered list of single-limb changes model the route. The support action resolves the hold frames and checks reach.

## @evidence contracts/development/design.md#minimal-and-owned-surface `wallClimbSupport` reads the starting holds and the moves to build support stances.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the existing climbing limbs and shared motion targets with no fitted poses or preselected holds.

# src/motion/human/climbing/IAutoMovieMotionHumanWallClimb.ts#IAutoMovieMotionHumanWallClimb.Hold

## @evidence contracts/development/common.md#meaningful-documentation

States the permitted targets, their units and when they are resolved.

## @evidence contracts/development/design.md#principled-representation

A hold is a physical location referenced by prop and point name or by an explicit point and frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A projection of the target union used to build and fit support contacts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Excludes person, self and imaginary targets by the existing discriminant.

# src/motion/human/climbing/IAutoMovieMotionHumanWallClimb.ts#IAutoMovieMotionHumanWallClimb.IMove

## @evidence contracts/development/common.md#meaningful-documentation

States what changes and what stays assigned.

## @evidence contracts/development/design.md#principled-representation

One limb and an optional destination encode transfer and release while keeping other assignments implicit.

## @evidence contracts/development/design.md#minimal-and-owned-surface `wallClimbSupport` reads the destination and optional stance timing and labels.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the common climbing limb and target contracts without an embedded posture.
