# src/reaction/staggerShift.ts#staggerShift

## @evidence contracts/development/common.md#meaningful-documentation

States the model, the series and its sum with the source, the measured defect and each argument's meaning and unit.

## @evidence contracts/development/implementation.md#principled-implementation

The fixed point of a linear response is the geometric series' sum, read from the ratio of two successive residuals on each axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ratio and one sum an axis.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A ratio outside what planted legs give (`SHARE`), or a first residual too small to give one, is not extrapolated: the two readings are added, as before.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two readings.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
