# src/motion/timeScaleMotion.ts#timeScaleMotion

## @evidence contracts/development/implementation.md#principled-implementation

Uniform clock multiplication preserves relative timing and whole-cycle phase while keeping the spatial trajectory; locomoteMotion compresses short strides and makeActorSynthesizer fits declared spans through this operation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This primitive owns only clock scaling, so callers choose sizing policy and playback remains unchanged.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There is no pose rebake or speed-specific clamp; callers must supply a representable positive scaled clock and downstream validation still owns clip-domain admission.

## @evidence contracts/development/common.md#meaningful-documentation

States the factor premise, seconds fields, shared pose ownership and unchanged spatial endpoint.

## @evidence contracts/development/implementation.md#efficient-algorithms

For K keyframes, one O(K) clock-copy pass and O(K) output entries; stride metadata adds constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Nested pose/expression values are reused because changing only the clock leaves them equivalent; no repeated geometry solve or cross-call cache occurs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the new clip and keyframes, while nested motion content remains borrowed; no retained workspace or task is acquired.
