# src/geometry/sweep/registerAutoMovieSurfaceVertices.ts#registerAutoMovieSurfaceVertices

## @evidence contracts/development/implementation.md#principled-implementation

Identity welding with an order-independent cell per sweep point: the trapezoid average over the point's actual neighbourhood.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Registration and finalization in one place; the network rig only names identities and samples.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No proximity welding, and an unknown identity is refused by `existing`.

## @evidence contracts/development/common.md#meaningful-documentation

States the identity rule, the cell rule and why writers keep their order.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(1) map work per registration; finalization uses O(S + D) registry bookkeeping for S sweep samples and D dependent bindings, plus at most nine profile queries per sample and the dependent probe compilations. Profile-query cost belongs to the compiled surface.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each shared identity compiles one writer and sampling coefficients after all reaches resolve. Geometric nodes and the emitted vertex share it; separate curve-end reads still reevaluate its one to three terms rather than caching per-pose coordinates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one index entry and ordered writer per vertex during compilation. Pending sweep records and dependent callbacks are cleared after finalization, including failure; emitted writers retain only their own sample records. The returned rig owns the writers.
