# src/geometry/AutoMovieEngineConstructionProfileTopology.ts#AutoMovieEngineConstructionProfileTopology.admit

## @evidence contracts/development/common.md#meaningful-documentation

Gives the supported end-role tags, original clock units, and the finite-positive period restriction.

## @evidence contracts/development/implementation.md#principled-implementation

Each piece looks up its original curve and admits a present period only when finite and positive. End-role admission accepts the three explicit values. Geometry and boundary collapse are read by the prepared profile's actual consumers.

## @evidence contracts/development/implementation.md#efficient-algorithms

The check visits each declared loop and piece once. It reads one map entry per piece and retains no source or query data.
