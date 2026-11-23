# src/exercise/prepareDanceFootCourse.ts#prepareDanceFootCourse

## @evidence contracts/development/common.md#meaningful-documentation

States fixed authored footfall/placement provenance, metre/second units, half-beat intervals, independent current-time reads and fresh placement ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Retains dance's last-arrived upper-bound search, strict swing-start comparison and original progress division. Native Leg.prepareArc owns the same clamped parabolic ankle/spherical rotation path; the lateral offset keeps its original unclipped affine expressions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered preparation creates held and travelling pairs; one shared current-interval selector feeds the three existing observations without computing unobserved vectors or rotations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No beat, footfall, sample, half-period boundary, clearance, contact comparison or current leg goal changes. A held placement still evaluates the native same-endpoint arc rather than returning a borrowed endpoint.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) interval metadata serves N footfalls; each query retains O(log N) selection and only its actual observation. First actual placement prepares each selected pair's fixed vector/slerp prerequisites once, avoiding their repeated construction on later reads.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Unchanged authored offsets, world placements, period and clearance prove fixed geometry equivalence. Every current progress and result remains independently evaluated; separate held/travelling pairs preserve the original endpoint arithmetic.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The dance plan owns N travelling and N+1 held records with at most one native arc reader per record until release. Query readings are local; no queried time, output vector, solved pose, FK workspace or growing history is retained.
