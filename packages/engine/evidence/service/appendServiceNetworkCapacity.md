# src/service/appendServiceNetworkCapacity.ts#appendServiceNetworkCapacity

## @evidence contracts/development/implementation.md#principled-implementation

Declared load is compared with stated capacity before root-direction reach identifies disconnected nodes; neither step computes hydraulic loss, voltage drop or diversified demand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared load and reach owners serve production service admission, while this phase preserves system/node finding order and the existing root-missing suppression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Finite capacity does not make invalid port demand safe; earlier numeric admission remains authoritative, and missing roots skip secondary reach accusations without rewriting the graph.

## @evidence contracts/development/common.md#meaningful-documentation

States scalar capacity versus connectivity responsibilities and their declaration-order paths in the parent gate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each system scans graph ports for load and builds a reach traversal, then scans nodes for membership, inheriting the reach queue's worst-case removal cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The reached-id set is built once per system and reused for all of its participating nodes; no cross-system result is assumed equivalent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Reached sets and scalar totals are temporary; source node ids and capacity values survive only in caller-owned validation findings.
