# src/render/film/IAutoMoviePlanProductionRenderJobProps.ts#IAutoMoviePlanProductionRenderJobProps

## @evidence contracts/development/design.md#principled-representation

Supplied runtime identities describe the caller's capture environment; the planner does not observe that environment or execute jobs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planProductionRenderJob exchanges timeline, effects, production, runtimeIdentity, sourceFingerprints, audioAssets, chunkFrames, guidePasses, tier; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Supplied runtime identities describe the caller's capture environment; the planner does not observe that environment or execute jobs.

## @evidence contracts/development/common.md#meaningful-documentation

Content identities and compiled timeline for one deterministic tier plan. planProductionRenderJob admits fingerprints, audio source/processing consistency, chunk size and tier projection, then computes range identities. The prose and members document how planProductionRenderJob interprets and admits these values.
