# src/everyday/bendLowerPitch.ts#bendLowerPitch

## @evidence contracts/development/common.md#meaningful-documentation

States the quantity solved, the search range, the reach model and the refusal with its feasible height.

## @evidence contracts/development/implementation.md#principled-implementation

The gap between the shoulder-to-target distance and the arm's reach (`bendLower.REACH` of upper arm plus forearm, near full extension, plus the palm offset), the shoulder read from the lowered trunk's forward kinematics, is scanned every `SCAN` degrees for the first inclination that closes it, then bisected between that one and the one before. The gap does not fall all the way: the shoulder swings down past a target at counter height, so the gap at the deepest inclinations opens again, and a bisection over the whole range would refuse a counter a slight lean reaches. Each shoulder within reach across the floor also gives the lowest height the hand reaches there, the reach sphere's bottom under it, kept for the refusal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One solve that reuses `bendLower.lower` for the body and HumanTrunk for the shoulder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The reach share is the measured `bendLower.REACH` and the `DEEPEST` bound is a named provisional constant; an unreachable target is refused with what it can reach, not clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 31 scanned and 30 bisected gap evaluations, each one lowered posture and one trunk forward-kinematics pass; the 30 steps bound the error below 5e-9 degrees.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each evaluation depends on its own inclination, so nothing repeats within a call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
