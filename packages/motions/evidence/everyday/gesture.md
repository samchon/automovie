# src/everyday/gesture.ts#gesture.plan

## @evidence contracts/development/common.md#meaningful-documentation

States what is planned and every refusal; the law's doc gives the phases, timing laws and provisional values.

## @evidence contracts/development/implementation.md#principled-implementation

Kendon's phases (Kendon 1980; McNeill 1992): hand goals from gestureStroke solved by the arm's inverse kinematics, the moving arms planned to, on and from them as one trajectory clear of the body; joint gestures added under an envelope; a bow is `AutoMovieMotionHumanLean.bow`, its hip shift from the engine's centre of mass solved at the peak pitch and scaled by the pitch's sine between. The entry's and the rest's arm angles are joint angles, so they follow the standing body.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The plan owns phase timing, transport and the channels and hands it declares; the body under it is the stand law's or, over a carrier, the carrier's (`under`); gestureStroke owns each gesture's goals and angles, `AutoMovieMotionHumanLean` the bowed posture, handGoals the arm solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The free-space transport time is the timing owner's; `BOW`, `DEEPEST_BOW`, `BOW_DOWN` and `BOW_UP` are the conventional and measured bow's; `JOINT_TRANSPORT` is a named provisional constant with no source found; Effort modifiers come from HumanEffort; no gesture or body is special-cased beyond the kind's own table rows.

## @evidence contracts/development/implementation.md#efficient-algorithms

Only moving hands plan trajectories. Between the ends, native playback and ordinary sampling read the live base, direct joints, fingers and planned arms without building a hand goal. Exact endpoints still fit the hand goals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The phase times, the hand preparations and the kind's direct bones belong to one plan. Each posture read lends its FK workspace and ROM projector to the base, the hand goals and the end carry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds its inputs, preparations and planned arm trajectories until it is released; borrowed workspaces end with each posture call.
