# src/posture/humanFootOffset.ts#humanFootOffset

## @evidence contracts/development/common.md#meaningful-documentation

States body/socket provenance, ankle-local metres, positive toe convention, default and original result ownership; the prepare companion binds unchanged geometry while varying only toe flexion.

## @evidence contracts/development/implementation.md#principled-implementation

Keeps the original foot-rest lookup, MTP subtraction and actual socket-owner branch. A non-foot socket uses the same rest-joint subtraction, negative lateral axis-angle rotation of its point and joint addition, without changing operation grouping.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared articulated transform serves raw HumanFoot.offset and a fixed-geometry prepare reader; HumanFoot and height-only consumers delegate to this owner rather than duplicating toe geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Raw reads still inspect the current body in their original order. Preparation binds only actual rest/socket geometry, never a posed point, toe angle, query result, sampled approximation or caller-provided derived offset.

## @evidence contracts/development/implementation.md#efficient-algorithms

Raw work stays constant. A fixed body/side/socket reader resolves rest joints and socket membership once, then each varying toe angle retains its actual quaternion articulation; the module shares only one private canonical axis reader.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The prepared reader requires unchanged body/rest/surface geometry. Foot-owned and MTP points remain angle-independent; every articulated angle runs the same shared transform and changing geometry requires another reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A caller-owned reader retains one bounded joint/socket description until released with its action; the private axis has module lifetime. No body-keyed cache, pose, query angle/result history, handle or task is retained.
