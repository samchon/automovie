# src/film/gatePerformShotCamera.ts#gatePerformShotCamera

## @evidence contracts/development/implementation.md#principled-implementation

Checks the framing solve's authored domain, a field of view strictly inside `(0, 180)` degrees, finite position and whip rotation components, while walking actual staged cameras. The interval makes the tangent positive and finite in exact arithmetic; this gate does not check derived binary64 representability, so an extremely small positive field of view can still underflow its half-angle to zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

All camera decisions that depend on the final election in one gate, after the action pass elects; framing vocabulary and targets go through the shared `validatePerformShotFraming` and `resolvePerformShotTarget`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every camera is held to the same domain whether hero or coverage, only cameras a move is compiled from are checked so an unused one never fails a shot, and the rotation is required only of a whip, the one move that reads it.

## @evidence contracts/development/common.md#meaningful-documentation

States the three steps with their rules, the fallback camera and why its id is gated, which cameras are checked and why the rotation is whip-only, and the returned values.

## @evidence contracts/development/implementation.md#efficient-algorithms

For I coverage intents and C cameras, camera joins cost O(I*C + C); the elected hero can scan F frame jobs for a whip. Target resolution adds group-member and rig traversals or caller callback work, and diagnostics add authored text and conversion costs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Gates one shot's cameras per call; the subject resolution reads the context's shared tables.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The covered-camera map is dropped on return; the caller owns the returned jobs, at most one per coverage intent.
