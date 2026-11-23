# src/film/performShot.ts#performShot

## @evidence contracts/development/implementation.md#principled-implementation

Sequences admitted stage groups before compilation and validates its assembled artifact against the commit contract; failed output validation throws as an engine defect. Target admission remains valid only while caller inputs and targetAt callbacks stay stable between gate and compile reads; custom synthesis can still return null.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This function owns the stage order, the shared gate context and the assembly; each gate and compile stage lives in its own module with its own contract, so the function reads as a sequence of named stages.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No beat, actor, camera or prop is special-cased; every refusal carries a path into the author's input, and the artifact check throws rather than downgrading an engine defect into an authoring violation.

## @evidence contracts/development/common.md#meaningful-documentation

States which list performs, every stage in order with its owner, the stop-at-first-failing-group rule, the locked-off fallback, how cameras and formations may be targeted, and when and why it throws; each input field documents its meaning and what omitting it does.

## @evidence contracts/development/implementation.md#efficient-algorithms

Gates include pairwise same-actor region overlap checks and sorted frame spans, so their cost is not uniformly linear; delegated launch, planting, camera, clip and artifact checks add their own population costs. Synthesis is invoked at most once per action object and actor within this call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Synthesis is memoized per action/actor, sharing one clip across overlap, launch and performance stages; staged lookups and per-node subject extents prepare once. After rig/clip admission, each attachment bake receives a genuine immutable snapshot of its actual fixed parent rig/mappings, sharing only static prerequisites and exact demanded-bone dependencies across its current samples. Stable gate/compile inputs remain the premise; target callbacks and pose samples are not memoized by this FK owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The call releases its synthesis WeakMap, gate context and framer. Each synchronous attachment bake releases its prepared demand/operation rows before returning only numeric tracks; no FK reader enters the returned shot. The caller owns the returned shot, motions and plants.
