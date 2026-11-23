# src/motion/fitHingedChainBend.ts#fitHingedChainBend

## @evidence contracts/development/common.md#meaningful-documentation

Defines source/target scope, original hinge eligibility, actual post-clamp shell check, result meanings and the separate orientation/curve validation obligations.

## @evidence contracts/development/implementation.md#principled-implementation

The shared Tolani hinge candidate fixes span and swivel. Its actual clamped joint pair is resolved through the same prepared FK; subtracting its analytic shell shortfall and applying the original PLANT_RESIDUAL_EPSILON bucket preserves bend acceptance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns the existing hinge candidate/admission block once. fitChainBend keeps ordinary pole/search ordering. Explicit prepared continuation first admits its source, then may call this block before otherwise unused generic pole and candidate-ranking continuity work.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Eligibility uses the actual lower joint's immobile abduction and axes. No ideal endpoint, relaxed residual, forced success, name-based branch or claimed global optimum replaces current post-clamp FK. An unadmitted candidate remains available to ordinary fallback ranking.

## @evidence contracts/development/implementation.md#efficient-algorithms

One existing cold or near hinge solve dominates, followed by two clamps and constant-size actual chain FK. The admitted winner alone copies the prepared source prefix. After original source admission, explicit continuation may avoid unused generic pole and candidate-ranking continuity work; timing savings are unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both callers use the same workspace rig, branch scorer, clamp and current endpoint check. Only unchanged source geometry is shared; every target, seed, projection and physical residual is evaluated anew, without prior-answer reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The call borrows one source workspace and owns one candidate, two clamped joints and one endpoint until return/throw. Only candidate metadata and a possible independent fitted joint-array result escape; no history, handle or global cache is acquired.
