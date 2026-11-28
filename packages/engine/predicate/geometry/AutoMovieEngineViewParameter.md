# src/geometry/AutoMovieEngineViewParameter.ts#AutoMovieEngineViewParameter.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Documents millimetre endpoints, the positive representable angle interval, identity default and diagnostic result.

## @evidence contracts/development/implementation.md#principled-implementation

The root variant checks a finite pole and its inward side. The angle order test and finite subtraction establish a usable span. Undefined follows the station identity.

## @evidence contracts/development/implementation.md#efficient-algorithms

The operation reads constant-size parameters, copies only an admitted map and retains no source state.

# src/geometry/AutoMovieEngineViewParameter.ts#AutoMovieEngineViewParameter.at

## @evidence contracts/development/common.md#meaningful-documentation

Documents the station mapping, relative endpoint tolerance and NaN result for invalid or out-of-span queries.

## @evidence contracts/development/implementation.md#principled-implementation

A finite station is mapped to signed root distance or into the angle interval. Near-endpoint gaps use the existing scale-relative tolerance. The two angle branches compute from the nearer end.

## @evidence contracts/development/implementation.md#efficient-algorithms

The map uses one scalar query and closed-form arithmetic. It needs no spline evaluation, iteration or stored per-query data.

# src/geometry/AutoMovieEngineViewParameter.ts#AutoMovieEngineViewParameter.contains

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the admitted station domain, including the explicitly tolerated endpoint portion.

## @evidence contracts/development/implementation.md#principled-implementation

The nonfinite guard applies to identity as well as explicit maps. The root branch tests the relevant endpoint gap, and the angle branch tests both, with the same scale as the forward mapping.

## @evidence contracts/development/implementation.md#efficient-algorithms

The readiness test performs constant scalar work without evaluating a square root or allocating query state.
