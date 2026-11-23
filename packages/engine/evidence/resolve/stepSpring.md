# src/resolve/stepSpring.ts#stepSpring

## @evidence contracts/development/implementation.md#principled-implementation

Advance non-root joints by Verlet inertia/gravity/stiffness, project length, then push outside inflated spheres; centre/ordered-chain keys independently transport shared-centre translation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One numerical stepper owns history/collision order with shared map readers and explicit caller state rather than a hidden clock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Zero collision separation uses fixed upward direction; transport is translation-only, collisions can stretch segments and later lookup failure can follow earlier state mutation.

## @evidence contracts/development/common.md#meaningful-documentation

Docs state positive seconds, metre radii, kinematic root, unchanged rotation/scale and in-place effects without visual quality claims.

## @evidence contracts/development/implementation.md#efficient-algorithms

J joints and C spheres need O(J*C+J) arithmetic plus chain-key text; state grows with visited joint and centre/chain identities.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

History recovers velocity and frame reseeding preserves prior sprung positions; separate centre records prevent another chain consuming a translation delta.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns persistent maps/world updates and resets removed-driver history explicitly; no automatic population bound, worker or native handle exists.
