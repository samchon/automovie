# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

The options state a sampled tolerance in millimetres and limits on subdivision depth and leaf intervals.

## @evidence contracts/development/design.md#principled-representation

The Ahn and Ghosh owners admit a finite positive tolerance and bounded integer work limits before sampling. Both partition the supplied source domain at interior breaks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The options own the requested tolerance and two work limits. The curve source owns the domain and the callbacks.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The alias describes supplied-domain completeness and the diagnostics available on refusal.

## @evidence contracts/development/design.md#principled-representation

Complete and partial outcomes carry fitted arcs and measured sampled error. Refusal requires an empty arc list, zero sampled error and a false certificate flag. Recovery uses those values when admission or source observations refuse the fit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result retains the established status tags and separates fitted and refused outcomes without adding a runtime field or copying samples.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IObservation

## @evidence contracts/development/common.md#meaningful-documentation

The common record gives the method label, its qualifications and the meaning of the query counter.

## @evidence contracts/development/design.md#principled-representation

Each Recovery method has a stable adaptation label and counts callbacks before invoking them. A callback failure remains visible alongside the work already spent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both outcomes expose the method, its explanation and the count. Samples and callback closures have no place in the report.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IFitted

## @evidence contracts/development/common.md#meaningful-documentation

The fitted variant gives source order, coverage and sampled millimetre error. It distinguishes a continuous error certificate from a sampled maximum.

## @evidence contracts/development/design.md#principled-representation

The Ahn and Ghosh adaptations report the maximum sampled error of the admitted arcs and set the certificate flag to false. They publish partial when subdivision leaves unresolved domains and admitted arcs survive.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result keeps the ordered coefficients for evaluation and the fit summary for qualification. The caller owns the original curve and evaluators.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IRefused

## @evidence contracts/development/common.md#meaningful-documentation

The refusal states that no arc coefficients, measured fit error or continuous certificate are available.

## @evidence contracts/development/design.md#principled-representation

Both approximators discard their coefficients on source failure. The refusal publishes the empty list, zero error and false certificate with diagnostics and query count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The refusal uses the existing result fields with fixed absence values. Its diagnostics provide the reason and its count describes the spent work.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IOptions.toleranceMm

## @evidence contracts/development/common.md#meaningful-documentation

Gives the positive sampled geometric tolerance in millimetres used to admit an arc.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IOptions.maximumArcs

## @evidence contracts/development/common.md#meaningful-documentation

Counts accepted and unresolved leaves against the resulting net limit.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IOptions.maximumDepth

## @evidence contracts/development/common.md#meaningful-documentation

Bounds the number of bisections from a supplied source interval.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IObservation.method

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the solver or numerical adaptation that performed the fit.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IObservation.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

Collects admission failures, omitted work and qualifications of the reported criterion.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IObservation.queries

## @evidence contracts/development/common.md#meaningful-documentation

Counts source evaluation and derivative invocations, including a call that fails.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IFitted.status

## @evidence contracts/development/common.md#meaningful-documentation

Uses complete for the supplied domain and partial for admitted subintervals.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IFitted.arcs

## @evidence contracts/development/common.md#meaningful-documentation

Stores fitted coefficients in source interval order for evaluation.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IFitted.maximumSampleErrorMm

## @evidence contracts/development/common.md#meaningful-documentation

Gives the largest measured sample error across the admitted arcs, in millimetres.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IFitted.certified

## @evidence contracts/development/common.md#meaningful-documentation

Requires proof of a continuous error bound for a true value. Both sampled adaptations return false.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IRefused.status

## @evidence contracts/development/common.md#meaningful-documentation

Identifies input or fit refusal, with its details in diagnostics.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IRefused.arcs

## @evidence contracts/development/common.md#meaningful-documentation

Declares the empty collection when no coefficients are admitted.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IRefused.maximumSampleErrorMm

## @evidence contracts/development/common.md#meaningful-documentation

Declares zero because there is no accepted arc error to report.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IRefused.certified

## @evidence contracts/development/common.md#meaningful-documentation

Declares false because refusal carries no continuous fit bound.
