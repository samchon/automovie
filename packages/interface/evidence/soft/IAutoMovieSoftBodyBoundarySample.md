# src/soft/IAutoMovieSoftBodyBoundarySample.ts#IAutoMovieSoftBodyBoundarySample

## @evidence contracts/development/design.md#principled-representation

One step identifies the anchor and capsule geometry that the fixed-step solver must use together, preserving absolute sampling rather than wall-clock state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sampler resolves moving actor geometry while the soft solver receives only its anchors and capsules, without depending on an actor rig.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Full arrays state the current boundary explicitly; the record contains no silently retained prior actor pose or partial-update convention.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the consumer, absolute step and the two resolved geometry populations that must belong to that step.
