# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64

## @evidence contracts/development/common.md#meaningful-documentation

The union documents the normalized local parameter, positions in millimetres, derivative unit and three coefficient layouts. It separates descriptive source metadata from the local parameter used by `evaluateBernstein64`.

## @evidence contracts/development/design.md#principled-representation

The `primitive` tag selects a named polynomial, rational or hybrid variant. `assertCurve64` checks coefficient densities, lengths, numeric domains and required weights in the Bernstein collection. The admitted piece evaluator chooses its fields by tag and evaluates the position and derivative per local parameter unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each piece retains its required coefficients and optional source metadata. The containing Bernstein curve owns the sequence and its phase intervals. The Engine evaluator reads one piece, so the other pieces and global phase partition stay outside this record.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IPolynomial

## @evidence contracts/development/common.md#meaningful-documentation

The variant says that all three axes are polynomial and records Bernstein order, `degree + 1` position coefficients and millimetre units.

## @evidence contracts/development/design.md#principled-representation

The polynomial tag carries one shared nonnegative degree and dense XYZ controls. Enclosing curve admission checks their count and finite components. The evaluator uses those controls directly for De Casteljau evaluation and their degree-scaled differences for the derivative.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The position coefficients and degree provide the polynomial evaluator's inputs. Polynomial dispatch reads the controls without a quotient. The optional provenance fields come from the common piece metadata.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IRationalCoefficients

## @evidence contracts/development/common.md#meaningful-documentation

The declaration gives the common degree, weight units, coefficient count and units of the weighted numerator. It explains the optional Euclidean sample representation as the coefficient-wise quotient.

## @evidence contracts/development/design.md#principled-representation

Both rational variants require matching numerator and denominator buffers. The collection admission checks dense finite vectors and positive finite weights. It checks the optional quotient cache component by component against the recorded numerator and weight with the Engine's relative tolerance. Evaluation uses the numerator and denominator as its authority.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two rational variants share the same degree, numerator, weight and optional cache semantics. Their inherited representation keeps the coefficient set in one place. Each tagged variant adds its own evaluation choice and independent Y controls only where the evaluator needs them.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IRational

## @evidence contracts/development/common.md#meaningful-documentation

The variant identifies rational evaluation on all three axes and the quotient-rule derivative. The inherited coefficient declaration gives the numerator, denominator and cache conditions.

## @evidence contracts/development/design.md#principled-representation

The rationalBezier tag requires the common admitted coefficients. The Engine evaluates three numerators and the common denominator at the same local parameter and applies the quotient rule on each axis. It checks a supplied cache against finite representable control quotients.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This variant's tag selects full rational evaluation. Its consumer reads the inherited coefficients for all three axes. The coefficient declaration also serves the hybrid piece.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IRationalXZPolynomialY

## @evidence contracts/development/common.md#meaningful-documentation

The variant identifies which axes use the rational field and which use the independent polynomial field. It explains the Y degree, its millimetre units and the relation of the optional cache to the numerator and weight quotient.

## @evidence contracts/development/design.md#principled-representation

The hybrid tag adds a nonempty longitudinal coefficient array to the shared rational coefficients. The collection admission checks its density and finite values. The evaluator derives the Y degree from its count and replaces the position and derivative for that axis. The cache check still describes the original three numerator components.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The independent Y array supplies precisely the coefficients consumed after the rational calculation. Its size records its degree independently of the numerator and denominator degree, while inherited metadata preserves the common local parameter.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IPolynomial.primitive

## @evidence contracts/development/common.md#meaningful-documentation

Documents the selector that makes the Engine evaluate the stored XYZ controls as a polynomial.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IPolynomial.degree

## @evidence contracts/development/common.md#meaningful-documentation

Names the nonnegative degree. Enclosing admission uses degree plus one to check the actual coefficient count.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IPolynomial.controls

## @evidence contracts/development/common.md#meaningful-documentation

States the coefficient units and Bernstein order. The Engine reads each coordinate column for both position and derivative.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IRationalCoefficients.degree

## @evidence contracts/development/common.md#meaningful-documentation

Documents the common degree of numerator and denominator. Enclosing admission applies degree plus one to each buffer.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IRationalCoefficients.homogeneousNumerator

## @evidence contracts/development/common.md#meaningful-documentation

Defines each weighted XYZ coefficient in millimetres times a dimensionless weight. The Engine divides the evaluated numerator by its denominator.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IRationalCoefficients.weights

## @evidence contracts/development/common.md#meaningful-documentation

Specifies positive finite dimensionless weights. The enclosing curve validator checks them before quotient evaluation.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IRationalCoefficients.controls

## @evidence contracts/development/common.md#meaningful-documentation

Describes the optional Euclidean cache. Enclosing admission checks it against each stored coefficient divided by its weight.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IRational.primitive

## @evidence contracts/development/common.md#meaningful-documentation

Documents the selector that applies rational evaluation to all coordinates.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IRationalXZPolynomialY.primitive

## @evidence contracts/development/common.md#meaningful-documentation

Documents the selector that uses the rational field on X and Z and the separate polynomial on Y.

# src/geometry/IAutoMovieBernsteinCurvePiece64.ts#IAutoMovieBernsteinCurvePiece64.IRationalXZPolynomialY.polynomialYControls

## @evidence contracts/development/common.md#meaningful-documentation

Specifies a nonempty sequence of longitudinal coefficients in millimetres. The evaluator uses their independent degree and replaces the Y derivative as well as its position.
