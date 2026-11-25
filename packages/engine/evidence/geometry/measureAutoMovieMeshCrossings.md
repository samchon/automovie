# src/geometry/measureAutoMovieMeshCrossings.ts#measureAutoMovieMeshCrossings

## @evidence contracts/development/implementation.md#principled-implementation

Two triangles cross transversally exactly when an edge of one pierces the other, which bounded Moller-Trumbore decides per edge, and coplanar triangles overlap exactly when their edges properly cross or one contains the other, decided in the plane of largest projected area; a median box hierarchy restricts each test to triangles whose boxes overlap.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one-shot census delegates to createAutoMovieMeshCrossingQuery, which owns the sole narrow phase, immutable target index, witness selection and deterministic broad-phase ordering.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Shared corners are excluded by exact identity rather than by widening every bound, the tolerance and classifier are caller-declared and can only remove witnesses, and the three numerical cutoffs are named as classification limits rather than presented as proofs.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, what an entry means and when the result is empty, the ordering and witness rule, `allPairs`, the strict touching rule, both options' semantics, the numerical cutoffs, what it does not measure, the self-test use, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For f first and s second triangles, the second hierarchy costs O(s log^2 s) and each first triangle collects only candidates whose boxes overlap its own, sorting them in O(k log k), with a constant-time narrow phase per candidate; the default mode stops at the first transverse witness.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates all preparation and census work to the reusable query owner. A one-shot call prepares a fresh target. When both arguments are the same mesh, the same snapshot supplies its ordered subject triangles. Repeated calls against an unchanged resident can retain createAutoMovieMeshCrossingQuery.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the subject and target triangle records and the target hierarchy for this call. A self census uses one ordered triangle array. The point classifier receives a fresh array per strict intersection only when supplied.
