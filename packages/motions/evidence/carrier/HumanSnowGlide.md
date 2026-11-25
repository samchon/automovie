# src/carrier/HumanSnowGlide.ts#HumanSnowGlide

## @evidence contracts/development/common.md#meaningful-documentation

States the supported techniques, sources and path and hand-contact ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Unweight between opposite ski cants about the actual support points. A Nordic pole stroke is one planned arm over the action (the reach to the named moving grip, the hold on it and the return), composed over the glide with the opposite-foot kick.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare one shared glide, then overlay the optional edge transfer, or compose the optional pole stroke's arm over the kicked glide.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Consume the given snow orientation and the named pole frames. A missing pole contact or a same-sign edge transfer is not converted into bilateral travel.

## @evidence contracts/development/implementation.md#efficient-algorithms

Once per pose, one base sample and two local foot rotations if the edge transfer is active; the pole arm is planned once per action and read off its trajectory.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the shared glide, foot pivot, round-handle fit and the arm planner (`AutoMovieMotionHumanArm.carried`).

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the input edge or pole data and one base plan for the action.
