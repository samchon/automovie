# src/posture/alignHumanHandSurface.ts#alignHumanHandSurface

## @evidence contracts/development/common.md#meaningful-documentation

Defines direction frames, unit-free quaternion, parallel-forward failure order and prepare's copied fixed-rest directions, lazy admission and fresh world-query outputs.

## @evidence contracts/development/implementation.md#principled-implementation

Gram-Schmidt projects forward across normalized normal and composes world basis times inverse rest basis before original normalization. prepare shares only the fixed rest inverse, first demanded after a successful current world basis, preserving cold world-first admission.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared basis and composition owner serves cold and fixed-rest prepared alignment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps world-first evaluation, original 1e-9 parallel threshold, original error text and quaternion multiplication/normalization order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cold alignment builds two bases and one inverse/composition; across Q prepared calls the fixed rest basis/inverse runs once, while every actual world basis and product/normalization still executes. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both entry points use identical basis/composition owners. Copied fixed rest directions establish inverse equivalence and isolate edits; failed admission, world frames and aligned answers are never retained, and changed fixed directions need another producer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Cold alignment retains no state. A prepared action owns two fixed direction vectors and at most one successful inverse until release, returning fresh quaternions and retaining no body, world input, time history or external handle.
