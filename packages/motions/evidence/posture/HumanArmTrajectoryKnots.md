# src/posture/HumanArmTrajectoryKnots.ts#HumanArmTrajectoryKnots.weights

## @evidence contracts/development/common.md#meaningful-documentation

States inputs, units and the result's shape.

## @evidence contracts/development/implementation.md#principled-implementation

The interpolant is linear in its knots, so its value on a knot's unit sequence is that knot's weight; read from `HumanArmRefine.hermite` itself, the weights cannot drift from the played interpolant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the unit sequences of the bracket and its two tangent neighbours.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No weight is assumed: end knots' zero tangents and uneven knot spacing come out of the interpolant's own reading.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most five scalar Hermite evaluations per grid instant, with one dense output row per instant for the reduced model.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading computed once by its caller.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh table and retains nothing.

# src/posture/HumanArmTrajectoryKnots.ts#HumanArmTrajectoryKnots.read

## @evidence contracts/development/common.md#meaningful-documentation

States inputs and result.

## @evidence contracts/development/implementation.md#principled-implementation

The played interpolant itself, `HumanArmRefine.hermite`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One interpolation an arm and grid instant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the reading playback makes.

## @evidence contracts/development/implementation.md#efficient-algorithms

G interpolations an arm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh arrays and retains nothing.

# src/posture/HumanArmTrajectoryKnots.ts#HumanArmTrajectoryKnots.splice

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the original clock, interior joins, true ends and the reader that admits the joined rows.

## @evidence contracts/development/implementation.md#principled-implementation

Adds the cubic Hermite endpoint tangent basis in physical seconds on the adjacent interval using the laid course's original central difference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the regular knot interpolant and adjusts only samples inside an interval touching an interior join.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the input clock, coordinates at every knot, true endpoint conditions and whole-course admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds work linear in the number of coordinates and frame samples of the two boundary intervals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the ordinary knot reader for positions and computes one scalar correction weight per affected sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Updates only fresh sampled rows and returns them without retaining the source course.

# src/posture/HumanArmTrajectoryKnots.ts#HumanArmTrajectoryKnots.reduce

## @evidence contracts/development/common.md#meaningful-documentation

States the contexts, the map and the result.

## @evidence contracts/development/implementation.md#principled-implementation

With the grid's step `d = W s` for the knots' step `s`: `1/2 d'Pd + q'd = 1/2 s'(W'PW)s + (W'q)'s` and a row `a.d` is `(aW).s`; a knot the problem holds fixed takes no step, so its column is left out. The grid's upper band is read as the symmetric matrix it stores.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The weights of each grid instant's moving knots, then the curvature, the gradient and the rows in turn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every row is carried; one whose coefficients all fall on fixed knots constrains no step and is omitted.

## @evidence contracts/development/implementation.md#efficient-algorithms

The grid band's stored entries times at most sixteen knot pairs each, into the knots' upper band of the widest coupling those pairs can write (V x W doubles for V variables, not V x V), whose nonzero band is then read off.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each linearisation is carried once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The upper band is released on return; the returned subproblem is the caller's.
