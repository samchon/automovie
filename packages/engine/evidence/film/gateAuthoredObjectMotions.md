# src/film/gateAuthoredObjectMotions.ts#gateAuthoredObjectMotions

## @evidence contracts/development/implementation.md#principled-implementation

The same resolveFrame CONSTRAIN stage checks the opening, authored keys, one-sided boundaries and analytical rotation-component extrema supplied by authoredRotationCriticalTimes. Scalar linear/step interpolation stays within endpoint ranges; quaternion SLERP and normalized lerp can exceed endpoint component bounds, so their derivative roots are explicitly evaluated. The actual clip sequence decides authority at every clock, and floating clock rounding remains; nonlinear driver combinations have no additional stationary-point solver here.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The artifact rule is `validateClipArtifact` with a shot-specific channel gate, channel identity is the sampler's own `channelKey`, the joint lowering is `sceneToNodes`, and the bound is `resolveFrame`, so this function only states which nodes and channels a shot admits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No door, prop, joint or shot is special-cased; every refusal is a stated rule, the channel key is built from validated fields rather than cast from an unchecked record, and a breach on an undriven channel is left to the prop's own gate instead of being blamed here.

## @evidence contracts/development/common.md#meaningful-documentation

States the two promises the gate fulfils, every refusal with its reason, the duplicate-id refusal, which props contribute joints, when and how the travel bound is measured, the one-report-per-channel rule, the undriven-channel exemption, and the empty-list answer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Typed outer clip/track records are a caller premise before post-validation reads. Artifact checks traverse clips, tracks and key components; forging every registry prop and sceneToNodes lowering add delegated model/graph costs. Profiled scenes add at most four rotation roots per segment and one-sided boundaries, then resolve the lowered graph, including drivers and constraints, once per distinct instant. Repeated direct loop curves share their first-cycle bound and sets deduplicate clocks and channel membership, without a fixed-rate sampling density.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The lowered graph, the drivable set, the baked channel and id sets and the profile list are each built once per call and shared by every clip and every sampled instant, and distinct key times are deduplicated so one instant is resolved once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Every set, the lowered graph and the resolved frames are dropped on return; the caller owns the returned violations.
