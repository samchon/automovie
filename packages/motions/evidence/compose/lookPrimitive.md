# src/compose/lookPrimitive.ts#lookPrimitive

## @evidence contracts/development/common.md#meaningful-documentation

States what moves, by what, and the channel claimed.

## @evidence contracts/development/implementation.md#principled-implementation

The gaze owner solves the eyes and the head for the target; the weight scales both shares alike where the head is recruited, the head's is 0 where the eyes are recruited alone so the neck and the head stay as the posture holds them, and the trunk's share is 0, since the trunk is another channel.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One clamp and one call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The weight is clamped to [0, 1], so an overshooting time course cannot turn the head past the target.

## @evidence contracts/development/implementation.md#efficient-algorithms

One gaze solution per written second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to HumanGaze.aim and lends the current composer operation's exact FK workspace; the arbitrary target callback and actual gaze remain evaluated in their original order.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its live props only. A synchronous write may borrow its composer's exact FK workspace, which never enters a target, retained callback or returned posture.
