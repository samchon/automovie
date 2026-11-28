# src/analysis/AutoMovieEngineEnvironment.ts#AutoMovieEngineEnvironment.validateContext

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies the metre context, ordered instants and light bounds, horizon convention, reserved IDs and field-addressed findings.

## @evidence contracts/development/implementation.md#principled-implementation

Instant and occluder scans preserve source order. Measured directions admit horizon calculation. A positive finite beam can be judged against the signed dot product of the normalized sun and ground up. Reserved IDs and plane checks use the context's authored fields.

## @evidence contracts/development/implementation.md#efficient-algorithms

The operation tracks reserved and seen IDs while scanning the supplied records and planes once. Horizon work only follows admitted horizon operands.

# src/analysis/AutoMovieEngineEnvironment.ts#AutoMovieEngineEnvironment.contextSolids

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the projection, declaration order, input premise and borrowed plane arrays.

## @evidence contracts/development/implementation.md#principled-implementation

One mapping selects each occluder's ID and plane reference. The plane geometry remains the same input to an analysis beam.

## @evidence contracts/development/implementation.md#efficient-algorithms

One new record per occluder is allocated. Each record shares its original planes.

# src/analysis/AutoMovieEngineEnvironment.ts#AutoMovieEngineEnvironment.dewPoint

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states temperature and humidity units, finite input requirements, the fitted interval and the extrapolation limit.

## @evidence contracts/development/implementation.md#principled-implementation

The estimator computes gamma from logarithmic fractional humidity with Sonntag's Magnus water-pressure coefficients 17.62 and 243.12 degrees Celsius. Inverting the relation produces dew point and recovers the input temperature at saturation. Nonfinite temperature and invalid humidity are refused before evaluation.

## @evidence contracts/development/implementation.md#efficient-algorithms

One logarithm and fixed scalar arithmetic produce the estimate. The coefficients are shared constants.

# src/analysis/AutoMovieEngineEnvironment.ts#AutoMovieEngineEnvironment.instant

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states exact matching, first-match ownership and the missing-ID sentinel.

## @evidence contracts/development/implementation.md#principled-implementation

A strict-equality search resolves the supplied ID in authored order and returns the original observation or null.

## @evidence contracts/development/implementation.md#efficient-algorithms

The scan stops at the first matching instant. Its return reuses the observation object.

# src/analysis/AutoMovieEngineEnvironment.ts#AutoMovieEngineEnvironment.hemisphereDirections

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names finite normal components, nonzero threshold, count, deterministic order and output size.

## @evidence contracts/development/implementation.md#principled-implementation

A scaled normalization establishes the hemisphere axis even if finite components have an unrepresentably large norm. An orthonormal basis lifts Hammersley disk samples with a square-root height, producing a cosine-weighted hemisphere.

## @evidence contracts/development/implementation.md#efficient-algorithms

One frame is prepared for all samples. Each iteration reverses at most 32 index bits for its angle and emits one vector.

# src/analysis/AutoMovieEngineEnvironment.ts#AutoMovieEngineEnvironment.rayObstructed

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the ray and interval, ordered short-circuit behavior, input solid premise and empty result.

## @evidence contracts/development/implementation.md#principled-implementation

Each solid delegates to the same half-space interval clipping owner. The existential query returns false for an empty list and stops when a surviving forward clip interval is found.

## @evidence contracts/development/implementation.md#efficient-algorithms

Only solids before and including the first hit are evaluated. Each clip can end at the first separating plane.

# src/analysis/AutoMovieEngineEnvironment.ts#AutoMovieEngineEnvironment.skyward

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the ground-frame rule and both zero-projection cases.

## @evidence contracts/development/implementation.md#principled-implementation

The ground's up vector is normalized and dotted with the direction. Strict positivity excludes the horizon and makes zero up return false.

## @evidence contracts/development/implementation.md#efficient-algorithms

One vector normalization and one dot product are used for each direction.

# src/analysis/AutoMovieEngineEnvironment.ts#AutoMovieEngineEnvironment.solidBlocks

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the ray interval endpoints, half-space convention, direction premise and normal-scaled parallel tolerance.

## @evidence contracts/development/implementation.md#principled-implementation

Each plane raises entry or lowers exit according to the sign of its slope. A parallel plane with the origin outside refuses the ray, and a crossed interval refuses when entry exceeds exit. Positive exit permits an interval touching the maximum-distance endpoint.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass keeps two scalar distances and stops at the first impossible half-space.

# src/analysis/AutoMovieEngineEnvironment.ts#AutoMovieEngineEnvironment.sunDirection

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the world frame, angular units and azimuth orientation, near-parallel refusal and light-travel convention.

## @evidence contracts/development/implementation.md#principled-implementation

The northern heading comes from orthogonally projecting the authored north vector. The normalized heading and up yield east by a cross product. Cosine bands in the horizontal plane and sine elevation along up orient the vector toward the sun.

## @evidence contracts/development/implementation.md#efficient-algorithms

The calculation creates one local site frame and applies fixed trigonometric and vector arithmetic.

# src/analysis/AutoMovieEngineEnvironment.ts#AutoMovieEngineEnvironment.solveSunPosition

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the output angles, site and UTC conventions, observer defaults, numeric boundaries and refraction scope.

## @evidence contracts/development/implementation.md#principled-implementation

The solver checks finite site and atmosphere scalars and the UTC calendar before arithmetic. Meeus's Gregorian Julian Day and apparent solar coordinates give the hour angle. The Reda and Andreas parallax and refraction equations give the topocentric angles, with refraction enabled from geometric elevation -0.83337 degrees. The rounded Kelvin term has a pole at -273 degrees Celsius and extreme admitted years can overflow the Julian-date polynomial. These are limits of the legacy model outside typical site conditions.

## @evidence contracts/development/implementation.md#efficient-algorithms

One Julian-date conversion and a fixed series of scalar operations produce the three angles.
