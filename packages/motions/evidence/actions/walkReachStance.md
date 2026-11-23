# src/actions/walkReachStance.ts#walkReachStance.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States which stance inputs stay fixed, angular units and the varying world-space hip.

## @evidence contracts/development/implementation.md#principled-implementation

The forefoot rocker begins where the ankle can bend no further and the trailing thigh is held at terminal stance's (Perry and Burnfield), so the ball never slides; a heel-strike stance adds the heel rise its flat foot keeps about its ball, weighted by the heel rocker's minimum-jerk progress (0 with zero slope at the strike, 1 with zero slope at the hand-over), turning about the heel while the sum is toes-up and about the ball once it is heel-up, so the hand-over to the ball keeps height and rate; past the ankle's side range the shank carries the foot about the border nearer the hip, which stays down, so that border never slides. The foot's heading, initial pitch, sole pivot and rigid pivot reader are resolved once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed stance geometry precedes one hip reader running the rocker, the trail, the pivot, then the edge.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Raising the heel only brings the thigh forward, so the trail's room has no fold to search; no trial hip or fit result is memoized.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation per scheduled stance; per hip at most `TOES_DOWN` heel-rocker passes, one rounded rise and one pass over the sole's points; a heel-strike stance prepares its ball rocker once, on its first hip, and reads one rounded rise per hip. A toe-pad turn lazily prepares its yaw/roll and socket geometry, then computes its toe-angle offset once for both rigid transforms.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body, side, scheduled foot, pelvis heading, pivot turn, rocker width and dorsal limit determine the shared geometry. A toe-pad turn's articulated offset is the same under its old and new rotation, so one local value serves both transforms; every trial computes its own toe angle and placed contact.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One reader retains one fixed foot and rigid-pivot reader until its root solve and deferred endpoint result release it, with no hip/query history.
