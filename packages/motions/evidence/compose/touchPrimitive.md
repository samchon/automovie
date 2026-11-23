# src/compose/touchPrimitive.ts#touchPrimitive

## @evidence contracts/development/common.md#meaningful-documentation

States the phases, the lift and travel formulas and the contact window.

## @evidence contracts/development/implementation.md#principled-implementation

A reach that lays a hand on a region is a motion-planning problem: the arm's whole action is one trajectory optimisation toward the goal laid on the region frame at each second of the hold, with the kind's offsets in that frame (`AutoMovieMotionHumanArm.carried` with a span).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One arm carry and one hand form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The lift and travel are shares of the hand; a count that is not whole throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

One trajectory planned per touch (or per pair of hands), its goal read once per waypoint; per written second one cubic read of it; a vessel laid upright adds the attitude's three hand readings and one hand solve (`AutoMovieMotionHumanArm.ICarry.attitude`).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `AutoMovieMotionHumanArm.carried`, `AutoMovieMotionHumanHand.form` and the effector's goal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitives close over their props and one hint.
