# src/lexicon/HumanCarriedLift.ts#HumanCarriedLift.over

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The posture at a second is the carry's own, blended from the entry posture while the lift lasts and toward a stand under the carried root while the set-down lasts; phases longer than the carry are scaled to fill it. Both ends' displayed roots include their whole-body rotations (`turnHumanPosture`); their positions are blended vertically and across the floor on the two minimum-jerk halves (rising first, coming down last) and their rotations by quaternion slerp, represented as a correction after the blended Euler heading, so a rotation carried outside those angles cannot disappear when a phase starts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two weights, one blend, the contact windows cut to the hold.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The heading is blended the short way round; a limb goal is blended as the joint angles its solve gives, so no limb jumps when the blend starts or ends.

## @evidence contracts/development/implementation.md#efficient-algorithms

The entry is frozen once per plan; a posture inside a phase freezes the carry's posture once (one whole-posture fit) and blends the joints, and one outside the phases costs the carry's own posture alone.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Within one posture call the carry's plan and the freeze share one forward-kinematics reader and the caller's range-of-motion projector; the bearer's bones the carry reads are its own. Nothing is kept between seconds.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds the carry's plan, the two phase lengths and the entry and frozen entry postures; each posture call's reader ends with it.
