# src/scene/buildPropArticulation.ts#buildPropArticulation

## @evidence contracts/development/implementation.md#principled-implementation

Builds all admitted local joint frames before parenting and resolves engine-lowered joint names/named model parts, using native attach to preserve existing world placement; acyclic unique joint data and transform hierarchies compatible with Three attach (no unsupported nonuniform scale decomposition) are premises. Profile drivers are not evaluated here.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the joint-to-existing-part lowering and saved local rests, leaving portable joint/driver solving to engine resolveFrame and sampled object-channel writes to the host; no current production host is wired to this producer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing placement/parent/part refuses instead of fabricating a mesh, and placementChildNode supplies canonical names; first prop spec per node wins and partial scene reparenting before a later refusal has no rollback, both requiring upstream admission rather than a hidden repair.

## @evidence contracts/development/common.md#meaningful-documentation

Explains separate joint frame/visible part, model-versus-joint transform meaning, imported-part limitation, saved-rest reset and unimplemented profile-driver projection rather than claiming complete prop playback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Maps S prop specs once, visits scene placements and J articulated joints in three linear passes with map lookups, stores J joint/rest records and restores J local TRS values; attach/world-matrix propagation adds actual scene-hierarchy work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses already-built model parts and canonical lowered names, and captures rest TRS once for repeated restore; mutable parenting/playback makes independent lowering effectful rather than a cacheable scene-id lookup.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

New joint groups own no GPU buffers and borrow/reparent existing parts; returned registry/rest closures retain J groups and rest clones until host lifetime ends. There is no detach or partial-failure rollback API, and actual model geometry/material ownership remains with the model/scene host.
