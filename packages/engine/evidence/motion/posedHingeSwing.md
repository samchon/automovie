# src/motion/posedHingeSwing.ts#posedHingeSwing

## @evidence contracts/development/common.md#meaningful-documentation

Defines model-metre end displacement, current-plane meaning, first-record source lookup, actual hinge convention and unchanged prepared-frame premise.

## @evidence contracts/development/implementation.md#principled-implementation

Forward kinematics at the source flexion and one degree more reads the hinge's physical swing without assuming its clinical sign; their difference gives the authored bend-plane side used by two-bone IK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One source-only FK reading owns the posed hinge swing, extracted from the swivel scorer so a workspace can share it without duplicating its mathematics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual source joints, clinical mappings and prepared offsets. The existing first-record lookup and missing-joint clinical-zero convention are preserved; no target or generated pose is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two first-record scans cost O(J) for J authored joints; one upper and two lower articulation compositions plus constant vector/quaternion work replace no candidate search and claim no measured speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The two source end readings share their exact fixed lower prefix and one lazily admitted lower factor/inner-product composer; both still check all clinical angles/frames and produce fresh outer products and end points. Source pose, chain, prepared ancestor/intermediate frames, axes and rest mappings determine the result independently of target. A workspace may reuse it only while those dependencies remain unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one derived displacement and releases call-local FK values; it retains no input, cache, handle or task. Any longer reuse belongs to the caller's source workspace.
