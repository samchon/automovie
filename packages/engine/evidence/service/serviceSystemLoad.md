# src/service/serviceSystemLoad.ts#serviceSystemLoad

## @evidence contracts/development/implementation.md#principled-implementation

Summing demand on ports opposite the root-facing direction yields the declared terminal load, with bidirectional and pass-through zero-demand ports following their stated semantics.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Capacity validation and schematic totals consume this common load definition while discipline-specific pressure and diversity remain outside its declaration arithmetic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Flow direction selects the load-bearing end for every system, without special-casing drainage ids or inventing a simultaneity factor.

## @evidence contracts/development/common.md#meaningful-documentation

Explains supply/return direction, fitting-zero and bidirectional omissions, system units and the absence of hydraulic/electrical performance modeling.

## @evidence contracts/development/implementation.md#efficient-algorithms

Every node's ports are filtered and summed once, O(P) time for P ports, with temporary filtered arrays bounded by individual node port counts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One load is derived per requested system from its current port demands; cross-system demand tables are not cached by this scalar owner.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Temporary filtered lists release on return and the output is a primitive, so no graph record remains retained.
