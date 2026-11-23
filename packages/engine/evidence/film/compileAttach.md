# src/film/compileAttach.ts#compileAttach

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the parent's bone by forward kinematics at evenly spaced keys and composes its world translation and rotation, the rigid fixed-joint relation. Linear keys are exact for a still or constant-velocity parent and approximate other motion; nonfinite/nonpositive spans and rates and unsafe interval counts are refused; feasible memory use and representable distinct key times remain caller premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One baker for both per-beat `attachTo` and staged mounts, called by `coupleObjects`, which owns chain order and id uniqueness; the optional `parentTransformAt` is the single seam through which a chained parent's ridden frame enters, so the composition is not duplicated for chains.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no bone, rig or prop; the bake uses the supplied bone-local offset directly or identity on omission, with unit offset scale and no parent-scale compensation.

## @evidence contracts/development/implementation.md#efficient-algorithms

S unchanged feasible samples retain motion sampling and ordered J-joint admission. Raw omission resolves B bones per moving sample; an explicit immutable parent prepares one bone-name demand and exact reader, so only its D ancestors compose on changes and only one output is copied. Motionless rest FK remains once, and every world callback still runs. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A supplied genuine poseResolution must match this fixed parent rig/clinical mapping. Its sorted one-bone demand and exact current dependency rows serve all samples in this synchronous bake; changed poses still receive full ordered joint admission and world callbacks remain per sample. No time, clip sample or attachment result is memoized.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The optional demand and O(U+B) exact rows release when this synchronous bake returns or throws. Only numeric position/rotation tracks escape, sharing one time array and holding 1+3+4 numbers per sample; no rig workspace, pose or callback is retained by the result.

## @evidence contracts/development/common.md#meaningful-documentation

States the per-sample composition formula, the parent frame choices, the unapplied scale, which joint tables must match the renderer, the rest-pose case, the clip's time base, sample count, id and both read semantics, and the throw.
