# src/geometry/IAutoMovieEvaluateBernstein64.ts#IAutoMovieEvaluateBernstein64.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result describes a millimetre point and derivative per normalized local t, including the distinct rational and hybrid evaluation paths.

## @evidence contracts/development/design.md#principled-representation

The evaluator requires finite local phase, complete finite coefficient vectors and positive weights where needed. It computes positions and derivatives by representation and can scale otherwise overflowing arithmetic before checking finite results. The hybrid evaluates Y independently of its rational XZ coefficients.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two vectors are required for local evaluation. Piece provenance and enclosing phase widths remain outside the result.

# src/geometry/IAutoMovieEvaluateBernstein64.ts#IAutoMovieEvaluateBernstein64.IResult.point

## @evidence contracts/development/common.md#meaningful-documentation

The point is in millimetres after polynomial, rational or hybrid-axis evaluation.

# src/geometry/IAutoMovieEvaluateBernstein64.ts#IAutoMovieEvaluateBernstein64.IResult.derivative

## @evidence contracts/development/common.md#meaningful-documentation

The vector gives millimetres per normalized local t before any enclosing width conversion.
