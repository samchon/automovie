# src/perform/synthesizeActorReach.ts#synthesizeActorReach

## @evidence contracts/development/common.md#meaningful-documentation

States branch/rig admission, model/world metre conversion, original duration timing, live source/callback reads, null/throw propagation and numeric-result ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Retains each verb's initial target read, dynamic-path test, static solve or original 24 Hz envelope bake. Every moving sample resolves its current target before its current frame and invokes the same full live reachPose solve in model space.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the three native arm-target branches and their static/dynamic envelope choice. makeActorSynthesizer keeps verb dispatch/gesture fallback, reachPose owns source admission and solving, and existing clip owners retain sampling/weighting.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No target, callback, time, source identity, chosen articulation or previous pose certifies reuse. Missing targets still refuse the whole clip, thrown callbacks propagate, and no sample count, envelope, candidate, ROM bound or frame arithmetic is changed.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F original samples, all F target/frame callbacks, source diagnoses/full-rest-FK reads and bounded hinge solves remain. Static targets retain their one solve and the helper adds constant dispatch work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The initial world target serves only the original static branch; moving targets and borrowed mutable geometry are reread after each actual callback. Identity cannot prove source scalar stability, so no fixed-source reader crosses samples.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Existing clip builders consume callbacks synchronously and retain only fresh numeric poses/keyframes. Callback closures and each sample's source data end on return/null/throw; no FK reader, target history, handle or task escapes.
