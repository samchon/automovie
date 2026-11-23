# src/kinematics/armChainFault.ts#armChainFault

## @evidence contracts/development/implementation.md#principled-implementation

The elbow's articulation rotates the hand's rest offset in the lower arm's own frame, so the elbow can move the hand exactly when the flexion axis is not parallel to that offset; the test is the cross-product sine of the two unit vectors against `PARALLEL_SINE`, which holds because the function first requires the hand to be the lower arm's child and both vectors to have nonzero length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rig diagnosis shared by `reachPose` and the perform-shot gate's arm-verb refusal, so the solver and the gate cannot disagree about which rigs can reach; the message formatting lives in two private helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads geometry rather than a convention name or a rig id; the parallel threshold is the engine's shared degeneracy scale applied to every rig alike, and nothing about a quadruped or T-pose is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the fault it detects and why it breaks reach, why the test is geometric, where callers ask it, every `null` case including the parent requirement, and what each parameter supplies.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linear search of the skeleton's bones for the hand, then constant vector arithmetic; the message is built only for a faulted rig.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one rig and side that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned fault.
