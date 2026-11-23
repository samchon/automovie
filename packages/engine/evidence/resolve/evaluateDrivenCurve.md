# src/resolve/evaluateDrivenCurve.ts#evaluateDrivenCurve

## @evidence contracts/development/implementation.md#principled-implementation

Validate a nonempty finite strictly increasing point list, select endpoint clamps or piecewise-linear interpolation, and use the first authored source when the input is absent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Curve validation and scalar evaluation share one owner; resolveDrivers separately chooses null/absent curve as the linear-range mode.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Direct null/malformed curves are refused, while nullable driver curves remain valid linear mode; this helper does not validate source finiteness and extreme intermediate overflow remains a numerical limitation.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify nonlinear authored curve admission, missing-source meaning, endpoint saturation and independence from a linear driver's inRange.

## @evidence contracts/development/implementation.md#efficient-algorithms

P points require O(P) validation and at most O(P) segment scan per call with O(1) auxiliary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Evaluation reuses borrowed authored points without copying; mutable point contents prevent retaining a validated-result cache solely by array identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only one scalar/error escapes; no point copy, channel registry, native handle or task survives evaluation.
