# src/service/routeLength.ts#routeLength

## @evidence contracts/development/implementation.md#principled-implementation

Math.hypot measures each three-dimensional leg and a declared-order sum yields developed polyline length rather than projected schematic length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Schematic totals use this scalar owner while route coordinates remain on the authored segment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bend fitting allowance or hydraulic equivalent length is invented; degenerate or absent legs contribute their measured zero.

## @evidence contracts/development/common.md#meaningful-documentation

States metres, full three-dimensional route, empty/singleton zero and finite-arithmetic premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

R route points require R-minus-one fixed-size norms, O(R) time and constant scalar storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each schematic edge is measured once in its report; no route-mutation-sensitive length cache is kept here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A primitive accumulated length escapes without copying the route or retaining endpoint records.
