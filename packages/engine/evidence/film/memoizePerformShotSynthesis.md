# src/film/memoizePerformShotSynthesis.ts#memoizePerformShotSynthesis

## @evidence contracts/development/implementation.md#principled-implementation

A synthesizer is a function of the action, the actor and the prior beat state; within one shot the prior state is fixed, so the action object and the actor key the result, and a `null` result is kept like a clip so a refused synthesis is not retried.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Structure: `performShot` makes one wrapper and hands it to the overlap, launch and performance stages, which then share one clip per action and actor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Caches by object identity, never by a serialized key, so two equal but distinct action objects still synthesize separately, as the stages that author them expect.

## @evidence contracts/development/common.md#meaningful-documentation

States the cache key, the cached `null`, the bound prior state and the wrapper's lifetime.

## @evidence contracts/development/implementation.md#efficient-algorithms

One `WeakMap` lookup and one `Map` lookup per call; each action and actor pair synthesizes once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The point of the function: every stage of one shot reuses the clip the first stage synthesized.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The cache is weakly keyed by action and held only by the wrapper, which the `performShot` call drops on return.
