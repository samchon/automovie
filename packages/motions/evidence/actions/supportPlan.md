# src/actions/supportPlan.ts#supportPlan.IKey

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its unit and timebase.

## @evidence contracts/development/design.md#principled-representation

A solved posture by joint angles at a second of the action.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the windows, intervals and course writers read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keys are built only by support.plan.

# src/actions/supportPlan.ts#supportPlan

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, units and result.

## @evidence contracts/development/implementation.md#principled-implementation

Between two keys the body moves on a minimum-jerk course in joint space carried by the prepared interval; a staged course's writers and the helper's grip follow it; the balance owner then wraps the plan on request.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Windows and channels, then intervals and course writers, then one transfer shared by authored reads and prepared playback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every hand contact window keeps its arm and hand; no key is skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Authored queries find an interval in O(log K) for K ordered keys; bare playback selects the prepared phase once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Intervals are prepared once per adjacent key pair and shared by every read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns the keys and one preparation per interval until settle releases their observations.
