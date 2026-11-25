# src/motion/AirborneMomentumDefect.ts#AirborneMomentumDefect

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates R(I omega+h) and compares it with L in world coordinates. Unobserved factory tensors supply their admitted SPD operator directly; foreign or publicly observed principals retain Q diag(I) Q^T. Unit frames and a pure history are premises; finite components and positive principal moments are admitted on the public path. The metric retains actual tensor conditioning and relative-motion cancellation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit and snapshot the integration's fixed target and physical budget, then reconstruct one queried momentum and return its scaled Euclidean error.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rate, inertia or momentum is clamped or repaired. A zero physical scale requires exact agreement and has no invented absolute floor. A sampled dense defect does not certify every intermediate time or the separate finite-difference observation stencil.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each measurement makes one history query plus a fixed-size tensor product and world rotation; a tabulated history's reading answers a second without an instant with its numbers and factorisation alone. A valid factory operator avoids principal materialization and its two rotations; the public path retains them. No perturbed integration or sampled pose is retained here; no wall-time improvement is yet measured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One integration copies target components and admits its relative/absolute budget once; those same captured scalars drive the component-scaled norm without rereading the caller's budget. Each time reads its actual history instant. Engine histories share exact principal inverses under copied quaternion keys; general histories retain their original inverse path, and changed physical inputs require a new integration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned integration-scoped callback holds its history, copied target and one scalar budget until the integrator releases it. Each query's vectors are temporary and no query population, body identity cache or external resource is owned here.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the conserved quantity, root/world frames, SI rate and momentum units, explicit physical budget, zero-scale rule and finite-arithmetic refusal.
