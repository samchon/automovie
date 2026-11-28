# src/geometry/IAutoMovieRegisteredPlanarCurvePiece.ts#IAutoMovieRegisteredPlanarCurvePiece

## @evidence contracts/development/common.md#meaningful-documentation

The declaration distinguishes the source interval and the normalized local parameter. Its polynomial derives the local parameter by an affine map, and the conic carries independent parameter speed. This is the difference used by `AutoMovieRecoveryCompactApproximation.evaluate` and by source replay.

## @evidence contracts/development/design.md#principled-representation

The `kind` tag chooses a complete saved polynomial or conic. The Recovery evaluator dispatches on that tag. The fitting paths assemble ordered source intervals, solve their constraints and record the observed discrepancy before storing the chosen variant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two variants carry the coefficients needed by the saved evaluator and the registration needed by the replay consumer. Source callback, fitting samples and subdivision state stay with the approximation implementation. The conic reuses `IAutoMovieRegisteredConicArc`.

# src/geometry/IAutoMovieRegisteredPlanarCurvePiece.ts#IAutoMovieRegisteredPlanarCurvePiece.IPolynomial

## @evidence contracts/development/common.md#meaningful-documentation

The variant documents the source interval unit, the relation between degree and coefficient count, planar millimetres and the largest sampled discrepancy. The outer union explains its linear source map.

## @evidence contracts/development/design.md#principled-representation

The compact fit chooses degree three through five. Its basis and emitted control array each use degree plus one positions, and it evaluates fitted and held-out samples before retaining a piece. The polynomial tag selects independent Bernstein evaluation of the two millimetre coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The saved polynomial exposes its degree, control points, source domain and measured fit error. Recovery reads the controls to evaluate and to count storage. Source replay maps the registered domain and quality consumers read the sampled error. The least-squares rows and endpoint fitting inputs stay within the fitter.

# src/geometry/IAutoMovieRegisteredPlanarCurvePiece.ts#IAutoMovieRegisteredPlanarCurvePiece.IConic

## @evidence contracts/development/common.md#meaningful-documentation

The variant documents positive-weight rational quadratic evaluation and independent local speed. Its inherited conic declaration explains the source interval, planar controls, weight and measured error.

## @evidence contracts/development/design.md#principled-representation

The conic variant adds the `conic` tag to the existing registered conic coefficient record. This keeps the three control points and positive interior weight required by the rational evaluator. The conic fitter checks candidate coefficients and geometric correspondence before the compact fitter can keep the conic.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recovery can pass the conic variant directly to `AutoMovieRecoveryConicApproximation.evaluate`. The same parent declaration serves stand-alone conic records. The compact format adds the tag used by its dispatcher and carries the inherited coefficient data directly.

# src/geometry/IAutoMovieRegisteredPlanarCurvePiece.ts#IAutoMovieRegisteredPlanarCurvePiece.IPolynomial.kind

## @evidence contracts/development/common.md#meaningful-documentation

Documents the polynomial selection used by Recovery's saved piece evaluation path.

# src/geometry/IAutoMovieRegisteredPlanarCurvePiece.ts#IAutoMovieRegisteredPlanarCurvePiece.IPolynomial.degree

## @evidence contracts/development/common.md#meaningful-documentation

Relates the permitted degrees three through five to the actual number of Bernstein controls emitted for a fitted piece.

# src/geometry/IAutoMovieRegisteredPlanarCurvePiece.ts#IAutoMovieRegisteredPlanarCurvePiece.IPolynomial.domain

## @evidence contracts/development/common.md#meaningful-documentation

Documents the ordered source interval in the callback parameter's unit. Replay uses its endpoints to compute the polynomial's local parameter.

# src/geometry/IAutoMovieRegisteredPlanarCurvePiece.ts#IAutoMovieRegisteredPlanarCurvePiece.IPolynomial.controls

## @evidence contracts/development/common.md#meaningful-documentation

Documents `degree + 1` planar controls in millimetres. Recovery evaluates the X and Y coefficient columns independently.

# src/geometry/IAutoMovieRegisteredPlanarCurvePiece.ts#IAutoMovieRegisteredPlanarCurvePiece.IPolynomial.maximumSampleErrorMm

## @evidence contracts/development/common.md#meaningful-documentation

Names the maximum observed discrepancy and its millimetre unit. The fit derives the field from sampled evaluation rather than a continuous error estimate.

# src/geometry/IAutoMovieRegisteredPlanarCurvePiece.ts#IAutoMovieRegisteredPlanarCurvePiece.IConic.kind

## @evidence contracts/development/common.md#meaningful-documentation

Documents the exact tag which dispatches a saved rational piece to the shared conic evaluator.
