# src/geometry/curve/measureAutoMovieCurveLength64.ts#measureAutoMovieCurveLength64

## @evidence contracts/development/implementation.md#principled-implementation

Integrates the Euclidean norm of each original world derivative on its actual finite parameter domain with the existing eight-point Gauss-Legendre nodes, weights and K/2K comparison.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This public owner admits source domains and interprets results from AutoMovieCurveLengthQuadrature64.measure; original curve producers supply derivatives instead of fitting a substitute cubic or exposing a general scalar integrator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Requires finite closed-domain derivatives and representable nodes/contributions, permits finite zero speed, and propagates callback failures. It neither clamps source queries nor treats the observed difference as a bound or medical/geometric proof.

## @evidence contracts/development/common.md#meaningful-documentation

States derivative/domain units, pure-callback/source ownership, piece-chart independence, finite endpoint admission, K limits, numerical failure and the observation-only result.

## @evidence contracts/development/implementation.md#efficient-algorithms

N pieces and K subdivisions use at most 24*N*K interior derivative reads plus 2*N endpoint checks; K is at most 1024 and all other scratch is constant-size, excluding callback work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Module-constant nodes/weights serve both rules and the existing cubic wrapper; endpoint admission and the coarse/fine observations are distinct reads with no cross-call cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows pieces/callbacks synchronously, retains only fixed 16 quadrature constants globally, and returns two scalars; no source reference, queue or task survives a call or exception.
