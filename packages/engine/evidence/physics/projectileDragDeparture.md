# src/physics/projectileDragDeparture.ts#projectileDragDeparture

## @evidence contracts/development/common.md#meaningful-documentation

Defines the dense-curve premise, actual clearance witness and conservative response to an uncertified interval.

## @evidence contracts/development/implementation.md#principled-implementation

A cubic Hermite position has quadratic Bezier derivative controls v0, 3*(p1-p0)/h-v0-v1 and v1. Nonnegative projected controls certify outward monotonicity on the whole interval, including a query starting inside it. Exact dyadic signs of the scaled controls avoid overflow, underflow and cancellation in this proof. The ODE's velocity law alone supplies no dense-curve certificate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read one actual interval, certify its three projected controls, measure its bounded endpoint gap, and continue only while that same initial episode remains uncleared.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No drag no-entry inference, epsilon, shifted query time, skipped uncertain interval or fabricated clearance is used. A negative/nonfinite control, exhausted search or unavailable time progress returns ordinary initial-contact reporting.

## @evidence contracts/development/implementation.md#efficient-algorithms

For K crossed integrator intervals, O(K) fixed-size exact sign queries and actual gap reads reuse the existing trajectory. It stops at the first clear witness or uncertified interval, with constant transient storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the one memoized drag trajectory and the caller's actual plane/tail gap reader; it duplicates neither integration nor collider geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Interval records and arithmetic products are call-local; only a scalar witness escapes and retains no flight, knot, collider or callback.
