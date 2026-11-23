# src/physics/resolveImpact.ts#resolveImpact

## @evidence contracts/development/implementation.md#principled-implementation

Normalize the supplied normal and apply a two-mass normal impulse using product restitution; penetration/speed thresholds choose through, embed, bounce or deflect. This heuristic omits friction and angular response, and extreme finite arithmetic can overflow.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One collision response owner admits masses, velocities and material coefficients, then returns impulse and both post-impact velocities for pose consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Penetration 0.6/0.85, speed 6/14 and through transfer 0.3 are the documented existing response policy; no consumer, fixture or actor identity changes those decisions.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify kilogram masses, metre-per-second velocities, coefficient ranges, normal orientation, no-closing deflection and thrown invalid input.

## @evidence contracts/development/implementation.md#efficient-algorithms

All branches use O(1) scalar/vector work and fixed-size output; no contact manifold or mesh traversal is performed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The no-closing branch borrows unchanged input velocities; active response creates new vectors. No cached collision result survives changed inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned response survives; no body history, iterative solver state or resource is held after the call.
