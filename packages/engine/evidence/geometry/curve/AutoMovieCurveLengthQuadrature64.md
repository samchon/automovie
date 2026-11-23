# src/geometry/curve/AutoMovieCurveLengthQuadrature64.ts#AutoMovieCurveLengthQuadrature64

## @evidence contracts/development/common.md#meaningful-documentation

States internal ownership, validated caller premises, unchanged GL8 arithmetic and policy-neutral observations.

## @evidence contracts/development/design.md#principled-representation

Represents Internal shared GL8 computation for original curve derivatives, with numeric observations separated from each public length owner's admission policy: companion namespace of 1 member (`measure`); units and frames named in its text: world, second, local. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieCurveLengthQuadrature64` in packages/engine/src/geometry/curve/AutoMovieCurveLengthQuadrature64.ts; its surface is the 1 member listed and the text shows 2 other files naming it, mostly packages/engine (2), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/curve/AutoMovieCurveLengthQuadrature64.ts#AutoMovieCurveLengthQuadrature64.measure

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates each original world derivative norm and unchanged GL8 weighted term in original piece/panel/node order for K and 2K; optional endpoints are observations only.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns computed sums with finite/underflow/node observations so public owners apply distinct existing contracts without a second quadrature implementation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not clamp parameters, manufacture derivatives or reject a legacy finite-final observation on strict-only premises; an out-of-domain rounded query is skipped and marked unavailable.

## @evidence contracts/development/common.md#meaningful-documentation

States validated input/units, optional endpoints, flags, exception propagation and observation-only accuracy.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses 24NK interior slots and optionally 2N endpoint reads, with fixed-size flags and scalar accumulators instead of an adaptive queue.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same speed reader, constants and summation serve both rules and both public length callers; no previous source measurement is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows callbacks and domains synchronously and returns scalar observations only; fixed module constants are the sole retained population.
