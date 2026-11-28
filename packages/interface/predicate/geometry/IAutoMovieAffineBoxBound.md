# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The callable distinguishes the exact squared-distance decision from the numeric result views. It documents binary64 duplicate combination first, the row scope and the conditions that refuse input or results.

## @evidence contracts/development/design.md#principled-representation

Recovery's `RecoveryChartReachableBox` checks the finite triples, threshold and budget before decoding values. It combines duplicate controls in input order, then computes exact dyadic endpoints and compares the squared target distance with squared tolerance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The callable borrows a row input and returns its independent result. Recovery's chart report uses this computation for a row witness. The chart fit owns any combined fit decision.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IInput

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names the signed terms, millimetre vectors, tolerance and raw-term budget. It gives the ordering constraint on the box and identifies repetitions as budgeted work.

## @evidence contracts/development/design.md#principled-representation

Common lower and upper vectors define the independent control box. The Recovery owner checks three finite slots in each vector, ordered bounds, positive finite tolerance and a safe positive raw-term cap before examining terms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input supplies only the values needed to bound a single substituted row. Solver observations and binding registries live outside this record. An empty term array represents a constant row.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.ITerm

## @evidence contracts/development/common.md#meaningful-documentation

The declaration gives the owning registry ordinal and the finite signed dimensionless coefficient. The input documents how repetitions combine.

## @evidence contracts/development/design.md#principled-representation

The Recovery owner requires a nonnegative safe integer ID and a finite coefficient. Its map combines repeated entries in input order and retains canceled IDs for the term count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One ordinal and one weight suffice for the coefficient map. The term borrows control identity from the owning registry, while the input supplies the position bounds these coefficients act on.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The declaration separates outward millimetre endpoints, approximate distance, exact comparison and finite coefficient totals. It explains the treatment of canceled IDs.

## @evidence contracts/development/design.md#principled-representation

The Recovery owner derives the exact row image and the three axis gaps. It rounds its endpoint views outward, computes the approximate norm from axis gap views and compares the exact squared values independently. It refuses an unrepresentable numeric view.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result exposes the row bounds and decision that the Recovery report consumes, with a concise message for diagnosis. Exact dyadic working values and the duplicate map stay inside the calculation.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IInput.constantMm

## @evidence contracts/development/common.md#meaningful-documentation

Defines the three constant millimetre offsets. Recovery initializes the lower and upper exact row sums with these values.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IInput.terms

## @evidence contracts/development/common.md#meaningful-documentation

Defines the supplied signed terms. Recovery counts the input length against the budget before combining repeated IDs.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IInput.lowerMm

## @evidence contracts/development/common.md#meaningful-documentation

Defines the common lower bounds in millimetres. Recovery selects each lower or upper contribution according to the combined coefficient sign.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IInput.upperMm

## @evidence contracts/development/common.md#meaningful-documentation

Defines the common upper bounds and their ordering relative to the lower bounds. The owner checks the pair on each axis.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IInput.targetMm

## @evidence contracts/development/common.md#meaningful-documentation

Defines the millimetre target that Recovery compares with each exact endpoint to obtain the signed interval gaps.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IInput.toleranceMm

## @evidence contracts/development/common.md#meaningful-documentation

Defines a positive finite millimetre threshold. Recovery uses a strict greater-than comparison on its exact square, so equality is admitted.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IInput.maxTerms

## @evidence contracts/development/common.md#meaningful-documentation

Defines a safe positive integer limit for all supplied entries. The owner checks raw array length before any duplicate cancellation.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.ITerm.id

## @evidence contracts/development/common.md#meaningful-documentation

Defines a nonnegative safe ordinal. Recovery uses exact numeric ID equality as the key for coefficient combination.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.ITerm.weight

## @evidence contracts/development/common.md#meaningful-documentation

Defines a signed dimensionless coefficient. Recovery checks its finite value before addition and the combined value before dyadic conversion.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IResult.lowerMm

## @evidence contracts/development/common.md#meaningful-documentation

Defines lower endpoint views in millimetres. Recovery rounds these endpoints down to preserve enclosure.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IResult.upperMm

## @evidence contracts/development/common.md#meaningful-documentation

Defines upper endpoint views in millimetres. Recovery rounds these endpoints up to preserve enclosure.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IResult.minimumDistanceMm

## @evidence contracts/development/common.md#meaningful-documentation

Defines the finite approximate distance view. Recovery applies a Euclidean norm to the rounded axis gaps.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IResult.infeasibleAtTolerance

## @evidence contracts/development/common.md#meaningful-documentation

Defines the exact strict comparison. Its result comes from squared dyadic values, independently of the approximate distance view.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IResult.weightSum

## @evidence contracts/development/common.md#meaningful-documentation

Defines the binary64 total of combined weights in first-ID order. Recovery checks that the result remains finite.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IResult.absoluteWeightSum

## @evidence contracts/development/common.md#meaningful-documentation

Defines the finite total of combined magnitudes. Recovery checks this independently of cancellation in the signed total.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IResult.terms

## @evidence contracts/development/common.md#meaningful-documentation

Documents the number of unique IDs including IDs reduced to zero. The result reads the map size.

# src/geometry/IAutoMovieAffineBoxBound.ts#IAutoMovieAffineBoxBound.IResult.diagnostic

## @evidence contracts/development/common.md#meaningful-documentation

Documents the message describing the separation between exact single-row feasibility and rounded numeric result views.
