# src/handling/HumanClaspCandidateFrames.ts#HumanClaspCandidateFrames

## @evidence contracts/development/common.md#meaningful-documentation

States the admission rule, its fallback, the units of both bounds and the frames returned per admitted index.

## @evidence contracts/development/implementation.md#principled-implementation

The upper arm's angle from hanging is the angle between the shoulder-to-elbow line and world down, read on the fitted pose; its band is the first Rapid Upper Limb Assessment limit at or above it, past the last band when above all.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reach admission, then band admission on two bones, then the contact frames of the admitted fits only; the bounds come from the caller so the clasp's constants have one owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No band or reach bound of its own; an arm no turn brings within reach keeps every turn, so the clasp still ranks them by clearance.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C candidates, R reaching and A admitted, two-bone FK runs R times and the seventeen-bone contact FK A times, sharing one FK workspace.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One FK workspace serves every pose of this synchronous search; each pose is resolved on its own.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The workspace and readers end at return; the returned frame maps belong to the caller's pair search.
