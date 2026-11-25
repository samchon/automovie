# src/actions/supportKeyHeels.ts#supportKeyHeels

## @evidence contracts/development/common.md#meaningful-documentation

States which feet are held, the two kinds of target (the heel's horizontal datum, or the lowest bearing socket's height on the ball or the toe) and each input's units.

## @evidence contracts/development/implementation.md#principled-implementation

A foot already on a floor target keeps the heel-to-toe offset its seed shows, so the fit does not slide a bearing sole; a foot whose heel stands above its lowest socket by more than `HumanFoot.BEARING` bears on that socket, which alone is placed at the target's height. A retained target reads the seed's sole, a new placement the preferred posture's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moved from `supportKey` unchanged; `supportKey.solved` adds its targets to the stance's holding targets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bearing height and the miss are the foot owner's and the caller's; a rig without a heel socket holds no heel target.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two FK passes over the feet's heel and toe bones, then constant work per foot.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The seed's bones serve the preferred posture's reading when the two postures are the same object.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns new targets and retains nothing.
