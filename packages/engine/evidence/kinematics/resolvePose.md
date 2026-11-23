# src/kinematics/resolvePose.ts#resolvePose

## @evidence contracts/development/implementation.md#principled-implementation

Standard forward kinematics over a rooted tree, composing quaternion rotations and rotating each rest offset by the parent's world rotation; a parent-first depth-first walk guarantees the parent frame exists when a child is reached, and it premises unit rotations, no rest scale, and a topology built from this unchanged skeleton.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Joint conversion, axis precedence and single-bone composition have the jointToQuaternion, skeletonJointAxes and resolvePoseBone owners. An optional preparePoseResolution adapter shares pure joint factors while keeping raw bone composition direct; this function owns admission order and the parent-first walk.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unreachable bones are omitted by the stated contract instead of being attached to a root or thrown on, and no bone or rig is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the composition for rotation and position, the axes precedence, that rest scale is ignored, the root default, the output order, which bones are omitted and how to gate on them, how stray and repeated joints are read, and each optional parameter's default.

## @evidence contracts/development/implementation.md#efficient-algorithms

Every call retains O(J) ordered joint admission and O(B) axes precedence. Omitted demand composes all reachable bones; explicit demand builds an O(B) parent map and visits only the demanded ancestor closure, returning K fresh outputs. A supplied reader shares pure exact-angle joint factors; raw bone arithmetic remains live. Direct pure FK shares immutable identity/origin defaults without per-call allocations; supplied adapters retain their original call-local default operands. Omitted topology adds O(B) construction. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Caller topology belongs to the same current skeleton. A supplied synchronous adapter shares only pure fixed-basis/exact-angle work after original clinical/frame reads; raw transforms retain original read/arithmetic order. Direct pure FK borrows immutable default operands only into input-preserving math; custom adapter calls retain fresh default operands and one missing-articulation identity per call. No raw mutable-input identity certifies a prior bone result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local articulation/demand maps and any adapter-owned call-local default operands end with the call. The direct path's two private immutable constants retain no source/result data, and all returned transforms/nested values remain fresh caller-owned copies. A supplied adapter owns weak admitted-basis factor workspaces until operation release, without retaining raw joints/transforms, history or a handle.
