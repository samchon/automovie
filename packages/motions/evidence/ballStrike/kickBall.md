# src/ballStrike/kickBall.ts#kickBall.contact

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs with their frames and units and the placement returned.

## @evidence contracts/development/implementation.md#principled-implementation

The instep's toe joint meets the ball's back, one radius behind its centre along the kick, the foot headed along the kick and plantarflexed by `POINT` (Lees and Nolan 1998).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pivot placement of the foot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The contact is the ball's own surface; nothing is offset by hand.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The foot's pivot about its toe joint is `HumanFoot.pivot`'s.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/ballStrike/kickBall.ts#kickBall.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusals; the law's doc gives the swing, the timing and the events.

## @evidence contracts/development/implementation.md#principled-implementation

The contact is the instep on the ball's back, refused beyond the leg's length from the kicking hip; the chamber is behind and above it in shank lengths, and the leg phrase swings the ankle from the stance through the contact to the follow-through.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The ball, the contact, the reach check, the chamber, the clock, the leg swing and the arm pulse over a still standing base.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A ball out of reach is refused with the leg's length, never stretched to; the phase lengths and the arm's angles are named provisional.

## @evidence contracts/development/implementation.md#efficient-algorithms

One standing probe and one placement at plan time; per frame the leg phrase's own work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the stand law, `HumanBall`, `HumanFoot.pivot`, the leg phrase and the joint pulse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan closes over the contact, the chamber, the stance and the clock.
