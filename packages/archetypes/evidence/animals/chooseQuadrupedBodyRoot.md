# src/animals/chooseQuadrupedBodyRoot.ts#chooseQuadrupedBodyRoot

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the one explicit body trajectory from hard horizontal course placement, unchanged terminal goals and prohibited per-limb root projection; states soft preference and binary64 interior ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Minimize displacement from the declared soft bob over the simultaneous feasible interval. Erode only by a coordinate-scaled arithmetic budget when an interior exists, leaving a narrower exact interval unchanged rather than widening its physical domain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit finite ordered bounds, derive a numerical interior and select the nearest point to the soft preference in that interval.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No physical tolerance, anatomical coefficient, species case, cached prior sample or altered foot goal makes an impossible interval feasible. This is the declared whole-body height policy, not a hidden modification of an authored hard root path.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of scalar operations chooses one height; no iterative root search, physical simulation, sampling loop or trajectory cache is introduced.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Consumes the common four-limb intersection without recomputing reach or duplicating the exact limb solver.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains no model, sample, buffer, callback or external resource.
