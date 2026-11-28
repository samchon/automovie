# src/math/AutoMovieEngineQuaternion.ts#AutoMovieEngineQuaternion.identity

## @evidence contracts/development/common.md#meaningful-documentation

Names the identity components and fresh result.

## @evidence contracts/development/implementation.md#principled-implementation

The multiplicative identity has vector part zero and scalar part one. Its rotation leaves a vector unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

One four-field record is allocated.

# src/math/AutoMovieEngineQuaternion.ts#AutoMovieEngineQuaternion.multiply

## @evidence contracts/development/common.md#meaningful-documentation

Names multiplication and application order, the unit premise and result ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The scalar-vector and vector-vector terms give the Hamilton product. Its norm is the product of operand norms in exact arithmetic.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four fixed expressions emit one quaternion without intermediate records.

# src/math/AutoMovieEngineQuaternion.ts#AutoMovieEngineQuaternion.normalize

## @evidence contracts/development/common.md#meaningful-documentation

Names the unit result, zero fallback and finite/nonfinite arithmetic domain.

## @evidence contracts/development/implementation.md#principled-implementation

Dividing by norm preserves the rotation of a finite nonzero quaternion. Finite maxima outside the safe squaring interval 2^-511 through 2^510 are rescaled first. The zero norm uses the explicit identity components.

## @evidence contracts/development/implementation.md#efficient-algorithms

The ordinary path reads the original record and writes one result. Extreme scaling uses a fixed four-component temporary.

# src/math/AutoMovieEngineQuaternion.ts#AutoMovieEngineQuaternion.inverse

## @evidence contracts/development/common.md#meaningful-documentation

Names the reverse-rotation premise, normalization and zero fallback.

## @evidence contracts/development/implementation.md#principled-implementation

Negation of the vector part reverses the axis while preserving the scalar part. Normalizing that conjugate gives the inverse orientation even for finite nonunit inputs, without promising the algebraic reciprocal of a nonunit quaternion.

## @evidence contracts/development/implementation.md#efficient-algorithms

The four conjugated scalars feed the normalizer directly without an intermediate quaternion.

# src/math/AutoMovieEngineQuaternion.ts#AutoMovieEngineQuaternion.fromAxisAngle

## @evidence contracts/development/common.md#meaningful-documentation

Names the axis and angle convention, zero fallback and fresh unit rotation.

## @evidence contracts/development/implementation.md#principled-implementation

The scalar part is cosine of the half-angle, and the unit axis is scaled by its sine. The normalization divisor permits finite extreme axis magnitudes without requiring their original squared norm.

## @evidence contracts/development/implementation.md#efficient-algorithms

The axis length and sine/cosine are computed once per angle. Extreme magnitude alone requires a scaled-axis record.

# src/math/AutoMovieEngineQuaternion.ts#AutoMovieEngineQuaternion.prepareAxisAngle

## @evidence contracts/development/common.md#meaningful-documentation

Names preparation ownership, angle unit and zero-axis parity with the direct entry.

## @evidence contracts/development/implementation.md#principled-implementation

Preparation reads the three coordinates, scales them and records their length. The reader uses the same half-angle formula and zero-length decision as fromAxisAngle.

## @evidence contracts/development/implementation.md#efficient-algorithms

Normalization setup is paid once. Each angle uses only a fixed sine/cosine computation and one result.

# src/math/AutoMovieEngineQuaternion.ts#AutoMovieEngineQuaternion.fromEuler

## @evidence contracts/development/common.md#meaningful-documentation

Names the intrinsic angle convention, degrees and concrete ordered product.

## @evidence contracts/development/implementation.md#principled-implementation

Each single-axis factor comes from the corresponding right-handed half-angle rotation. Their Hamilton product in the declared order gives the same ordered intrinsic orientation.

## @evidence contracts/development/implementation.md#efficient-algorithms

The three fixed axes are prepared once. Each requested factor is computed as it is multiplied into the accumulated quaternion.

# src/math/AutoMovieEngineQuaternion.ts#AutoMovieEngineQuaternion.rotateVector

## @evidence contracts/development/common.md#meaningful-documentation

Names the unit premise, output and numeric recovery policy.

## @evidence contracts/development/implementation.md#principled-implementation

Two cross-product terms expand the unit-quaternion sandwich product. On overflow the existing helper rescales by 16, enough for its largest intermediate, and separately transports any lost subnormal vector remainder. Finite direct components are retained.

## @evidence contracts/development/implementation.md#efficient-algorithms

The ordinary calculation uses a fixed scalar expression and one result. Overflow recovery handles at most two scaled pieces for a supported vector.

# src/math/AutoMovieEngineQuaternion.ts#AutoMovieEngineQuaternion.rotateVectorY

## @evidence contracts/development/common.md#meaningful-documentation

Names the single-coordinate output and the unit rotation premise.

## @evidence contracts/development/implementation.md#principled-implementation

The same two cross-product terms form the Y coordinate. A finite direct result is returned immediately. A nonfinite result uses the shared complete rotation and its recovery path.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordinary calls avoid forming a vector or evaluating the final X and Z expressions. The fallback reads only Y from the completed coordinates.

# src/math/AutoMovieEngineQuaternion.ts#AutoMovieEngineQuaternion.slerp

## @evidence contracts/development/common.md#meaningful-documentation

Names the unit premise, shortest arc, extrapolation and near-endpoint fallback.

## @evidence contracts/development/implementation.md#principled-implementation

Equivalent quaternion signs make a negative dot become positive before selecting the arc. Dot greater than 0.9995 uses normalized linear blending to avoid a small sine divisor, and equality follows the angular branch. Both branches normalize their result.

## @evidence contracts/development/implementation.md#efficient-algorithms

One endpoint dot selects one weight calculation. The chosen blend uses fixed scalar components and one result record.

# src/math/AutoMovieEngineQuaternion.ts#AutoMovieEngineQuaternion.prepareSlerp

## @evidence contracts/development/common.md#meaningful-documentation

Names snapshot ownership, the unit premise, shorter arc and extrapolation.

## @evidence contracts/development/implementation.md#principled-implementation

Preparation uses the same sign correction and 0.9995 branching rule as slerp. The angular branch retains its angle and sine, while the linear branch retains signed coordinates. Each returned rotation is normalized.

## @evidence contracts/development/implementation.md#efficient-algorithms

The endpoint reads and arc preparation occur once. Each read computes only its chosen weights, normalization and output.

# src/math/AutoMovieEngineQuaternion.ts#AutoMovieEngineQuaternion.angle

## @evidence contracts/development/common.md#meaningful-documentation

Names the radian output, interval, orientation premise and sign equivalence.

## @evidence contracts/development/implementation.md#principled-implementation

Form the relative rotation using the normalized conjugate of the first quaternion, then use twice atan2 of its vector norm and absolute scalar part. The vector part retains small separations that would round away from a cosine near one.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scalar callbacks keep the relative quaternion's four components local and construct no temporary rotation records.

# src/math/AutoMovieEngineQuaternion.ts#AutoMovieEngineQuaternion.angleAfterNormalize

## @evidence contracts/development/common.md#meaningful-documentation

Names the first-argument transformation, the resulting angular operation and its numeric boundary.

## @evidence contracts/development/implementation.md#principled-implementation

The first record goes through normalizer semantics, then its conjugate is normalized again at the inverse boundary. The same relative-vector atan2 formula as angle gives radians.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pass completed components through callbacks. The extra normalization is explicit, and no separately normalized output record is constructed.
