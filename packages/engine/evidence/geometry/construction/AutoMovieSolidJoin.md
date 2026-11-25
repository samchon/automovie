# src/geometry/construction/AutoMovieSolidJoin.ts#AutoMovieSolidJoin.create

## @evidence contracts/development/implementation.md#principled-implementation

Composes the trace or supplied curve, chord rails and analytic ribbons, then performs the original sampled domain/crossing/fold checks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation owns admission order and returned closures while trace, rail, ribbon and blend owners retain their numerical methods.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A supplied curve suppresses its trace diagnostics; multi-face crossing and unsampled fold/domain behavior remain unchecked, with no width shrink or numerical repair.

## @evidence contracts/development/common.md#meaningful-documentation

States borrowed callbacks, supplied-curve admission gap, observed failures, units and result lifetime. Failed normal comparisons retain their signed dot, operands and actual rail addresses, distinguishing zero/nonfinite dot from reversal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares C declared columns and an address order once. Identifying an exact address uses O(log C) comparisons and another address solves one local rail. The strict single-face crossing scan is O(C²). The fold test uses a fixed number of shares and adds its measured operands to a failed observation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The declared column carries its rail, ribbons and outward direction. The exact address lookup serves those columns even for nonuniform clocks. Other requests perform their own solve, and the normal observer reports its already read operands.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Successful readers borrow the fixed declared columns and their index. Independent queries hold local data until return.
