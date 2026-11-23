# src/index.ts#assertRecoverySceneLinearRetention

## @evidence contracts/development/implementation.md#principled-implementation

For C=6N-7 active coordinates, 16E(C+4)+16C^2+12L(C+4)+64 bounds joint arrays, retained point copies and fixed current-radius chart scratch. Additional transient slots cover growth/resection factors; safe integer checks precede allocation under the unchanged ceiling.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One preallocation check serves growth, resection and joint owners without changing geometric gates or charging computational work.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No postallocation check, raised ceiling or byte/RSS interpretation supplies capacity. Failure uses the scene budget error so the accepted geometry remains unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

Defines active width, retained versus transient slots, seed exclusion and logical-memory qualification.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed scalar arithmetic costs constant time and space, avoiding an allocation solely to measure its size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Callers maintain population counts while growing points; the same bound checks the eventual joint fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

This check acquires no arrays or external resources and returns no state; its distinguished error preserves the caller-owned checkpoint.
