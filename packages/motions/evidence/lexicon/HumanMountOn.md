# src/lexicon/HumanMountOn.ts#HumanMountOn.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the events and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Effector goals solved by the shared inverse kinematics: the seat socket on the seat, each ball of a foot on its tread. Every path is a minimum-jerk share (Flash and Hogan 1985). A foot is declared planted only while its hip keeps the ankle within the leg's reachable band, so no plant is held by a leg that cannot reach it. The hands' way from hanging to the thighs is one planned course of both arms (TrajOpt, through `courseArmGoal`) on the thigh goals, so it keeps clear of the turning trunk. The legs are coursed once over the climb (`courseHumanLegs`), so the thighs the hands are laid on are the thighs every reader places.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Refuse, time the climb, place the feet's ends, find when each foot leaves and bears, course the legs, then one posture function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rest out of the seated leg's reach is not clamped onto: the foot hangs, as the seat's `footrests` doc declares. The timing shares and the constants of `HumanMount` are provisional and named.

## @evidence contracts/development/implementation.md#efficient-algorithms

Planning scans the climb at 60 Hz three times, each step one forward-kinematics pass of the pelvis, lays one legs' course and one arm course per plan; a posture costs one such pass, the legs placed at their course in closed form, the hands' fits with the palms prepared once (`prepareSeatedPalms`) and a read of the courses.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The feet's ends and instants are computed once per instance; each posture passes its caller's forward-kinematics reader and range-of-motion projector to the hands' fit (`seated.arms`).

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan's closures hold only the instance's own inputs and are released with the performance.
