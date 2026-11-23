# src/perform/makeActorSynthesizer.ts#makeActorSynthesizer

## @evidence contracts/development/implementation.md#principled-implementation

Uses resumed verified beat facts, shared rigid actor-frame conversion and the existing gait/IK primitives; explicit locomotion durations scale the clock, positional destinations preserve full displacement with ground-speed cadence, and live targets are sampled at 24 Hz.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Verb dispatch remains here while synthesizeActorReach owns point/strike/reach target bakes; shared frame/continuation and existing envelopes retain their original responsibilities and staged conversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reference constants 8 gait samples, 24 Hz live targets, 40% jab peaks and 32 degree maximum reaction are declared choreography policies, not measured physical guarantees; no guessed rig geometry or hidden ROM clamp is introduced for reaches.

## @evidence contracts/development/common.md#meaningful-documentation

States supported verbs, geometry requirements, rigid model/world frames, eye-height gaze lifting, prior-beat ownership, callback failure and null outcomes; returned clips still require downstream gates and live-target interpolation is approximate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Construction checks gait names linearly; each action rebuilds O(A+N+P) resumed maps plus its original gait/keyframe/IK or 24 Hz sampling work. Native moving arm bakes retain every original full source admission, sample and candidate search because callbacks may edit borrowed rig/mapping values.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A resumed snapshot/static frame serve each action; static targets solve once and dynamic callbacks retain every original time. Borrowed mutable rig/mapping values remain live at each arm sample, with no identity-based source reuse or cross-action answer cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The host owns captured context/placement maps for this callback's lifetime. Invocation snapshots and intermediate poses end on success/null/throw; only numeric clips escape, with no retained source reader, process or renderer handle.
