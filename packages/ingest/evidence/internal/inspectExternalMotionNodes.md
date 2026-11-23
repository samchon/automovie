# src/internal/inspectExternalMotionNodes.ts#inspectExternalMotionNodes

## @evidence contracts/development/implementation.md#principled-implementation

Three/four-component tuples use glTF defaults; positive scale and unit-quaternion tolerance precede rotation normalization.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Node interpretation owns stable index ids, parent ids and local transforms, separate from animation channel decoding.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Matrix transforms are refused rather than decomposed; rig names do not invent skeletal semantics.

## @evidence contracts/development/common.md#meaningful-documentation

Prose states defaults, matrix refusal, positive scale, quaternion normalization and absent name/parent meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

N nodes require O(N) time and output records, with fixed-size tuple work per node.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The admitted parent table is reused from structural hierarchy checks; each node transform is interpreted once per inspection.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned node records own new fixed-size transforms; source JSON arrays and tuple temporaries are not retained.
