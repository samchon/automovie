# src/posture/HumanFitTargetSlopes.ts#HumanFitTargetSlopes.rotation

## @evidence contracts/development/implementation.md#principled-implementation

Applies omega + 0.5*(e cross omega) + factor*(e cross (e cross omega)), the existing inverse-right-Jacobian formula and its inherited small-angle series.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Computes the error norm and scalar coefficient once, then maps each angular velocity to its complete three-component derivative.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves every original vector operation, multiplication association and Number.EPSILON-based branch; no derivative or small coefficient is dropped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(n) time and O(n) vector storage for n motions, computing each full column once instead of once per selected axis; speed is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the unchanged e norm and coefficient across motions and each resulting vector across the row owner's three axes; the next reading produces new columns.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns caller-owned vectors without retaining e or motions; the row builder releases the temporary columns after producing scalar coefficients.

## @evidence contracts/development/common.md#meaningful-documentation

States the source, frame, units, ordering, inherited series and temporary output lifetime.

# src/posture/HumanFitTargetSlopes.ts#HumanFitTargetSlopes.normal

## @evidence contracts/development/implementation.md#principled-implementation

Uses the existing analytic derivatives of the normalized cross axis and atan2 angle; the parallel case projects omega onto the transverse plane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepares normal geometry once, retains the original parallel/antiparallel branch, then maps each angular velocity to its complete derivative.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the inherited sqrt(Number.EPSILON) test, antiparallel refusal and exact arithmetic expressions; an empty motion list requests no derivative and preserves the former no-refusal behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(n) time and O(n) vector storage, sharing normalized normals, sine/cosine and angle and producing one column for both transverse axes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only invariants of this target, current rotation and motion list are shared; each new body reading or variable list recomputes its actual columns.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only temporary geometry and returned vectors for this row build, retaining no target, rotation or motion state globally.

## @evidence contracts/development/common.md#meaningful-documentation

States the analytic method, target-frame units, projection owner, degeneracies, empty-list behavior and ownership.
