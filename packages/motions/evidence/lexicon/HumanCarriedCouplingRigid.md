# src/lexicon/HumanCarriedCouplingRigid.ts#HumanCarriedCouplingRigid.IRead

## @evidence contracts/development/common.md#meaningful-documentation

Names the placement and the key pose's resolved bones, which the stance fit reads the held regions on.

## @evidence contracts/development/design.md#principled-representation

The registration and the held-region gaps read the same key pose, so its bones are returned beside the placement instead of being resolved a second time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by `HumanCarriedCouplingFit.fit`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The bones are the ones this registration resolved, never a caller's.

# src/lexicon/HumanCarriedCouplingRigid.ts#HumanCarriedCouplingRigid.read

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed contact, the hand fit, each frame and the bones returned with the placement.

## @evidence contracts/development/implementation.md#principled-implementation

Wahba's rotation about the fixed resting point, solved by Horn's absolute orientation on every hold direction and its opposite; the clouds' centroids are the resting points, so translation cannot trade their exact coincidence. With fewer than two holds, the key's two horizontal axes keep the heading its hold does not determine.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The resting points, the hold directions, the orientation and its point map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The carry's provisional row supplies the hold places; the registration introduces no fitted coefficient.

## @evidence contracts/development/implementation.md#efficient-algorithms

One trunk resolution of the key pose and one rigid registration over at most three directions and their mirrors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The key pose's bones are returned so the stance fit reads its held regions on them, not on a second resolution of the same key pose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned bones belong to the caller; the placement closes over two points and a turn.
