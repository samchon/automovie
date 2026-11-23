# src/physics/projectileSphereHit.ts#projectileSphereHit

## @evidence contracts/development/implementation.md#principled-implementation

Subdivide [0,tMax] into equal time chords, use segmentSphere for the first chord entry, and interpolate its point and time. This approximates a curved ballistic path and can miss curvature between samples.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The time loop owns sampling while projectileAt and segmentSphere own motion and analytic chord intersection; no collision engine is embedded.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Default 120 steps is the exposed sampling policy, not a fixture-tuned answer; null means no sampled chord hit rather than proof of no continuous-path collision.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify positive finite tMax, positive integer steps, hit time in seconds and chord-interpolated point; callback-free invalid arguments throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Up to S steps require O(S) constant-size state evaluations and intersections, retaining only adjacent states and the first hit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each previous endpoint is reused as the next chord start; no trajectory array or cross-projectile cache is built.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The loop returns immediately on hit and retains O(1) vectors; no task or handle survives null, hit or failure.
