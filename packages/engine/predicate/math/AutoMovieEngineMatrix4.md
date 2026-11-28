# src/math/AutoMovieEngineMatrix4.ts#AutoMovieEngineMatrix4.identity

## @evidence contracts/development/common.md#meaningful-documentation

Names the new result, matrix size, layout and identity transform.

## @evidence contracts/development/implementation.md#principled-implementation

The four diagonal entries are one and all off-diagonal entries are zero. Multiplying an affine point represented with a final one leaves every coordinate unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed sixteen-entry literal creates the result.

# src/math/AutoMovieEngineMatrix4.ts#AutoMovieEngineMatrix4.compose

## @evidence contracts/development/common.md#meaningful-documentation

Names transform order, layout, rotation premise, units and collapsed column behavior.

## @evidence contracts/development/implementation.md#principled-implementation

The quaternion forms three rotation columns. Each is multiplied by its own scale, then the translation is placed in the last column. Zero scale loses that column's direction. Nonunit quaternions can distort the basis.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compute the shared quaternion products once, then write the three scaled columns and translation into one matrix.

# src/math/AutoMovieEngineMatrix4.ts#AutoMovieEngineMatrix4.multiply

## @evidence contracts/development/common.md#meaningful-documentation

Names layout, application order, input shape, ownership and arithmetic limits.

## @evidence contracts/development/implementation.md#principled-implementation

The entry at column c and row r is the product of the left row r with the right column c. Matrix multiplication retains shear from chained scale and rotation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four fixed terms are accumulated for each of 16 output entries, without copying the operands.

# src/math/AutoMovieEngineMatrix4.ts#AutoMovieEngineMatrix4.position

## @evidence contracts/development/common.md#meaningful-documentation

Names the matrix premise, the local origin interpretation and output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The last affine column contains the image of the homogeneous local origin. Slots 12 through 14 are copied into X, Y and Z.

## @evidence contracts/development/implementation.md#efficient-algorithms

Only three matrix entries are read, and one record is created.

# src/math/AutoMovieEngineMatrix4.ts#AutoMovieEngineMatrix4.transformPoint

## @evidence contracts/development/common.md#meaningful-documentation

Names input layout and frame, affine translation and result ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The point's homogeneous coordinate is one, so translation contributes directly. The unused fourth affine row would yield one. A projective divide or rotation-only direction transform is outside this entry's premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three fixed linear combinations produce one record and skip the unused fourth output.

# src/math/AutoMovieEngineMatrix4.ts#AutoMovieEngineMatrix4.decompose

## @evidence contracts/development/common.md#meaningful-documentation

Names layout, scale sign, rank completion and the approximation limits for scaled bases.

## @evidence contracts/development/implementation.md#principled-implementation

The three column norms supply unsigned scales and the normalized columns supply a rotation basis. A missing column uses the oriented cross product, one surviving column sets a shortest-arc frame and rank zero uses the canonical axes. A trace-based conversion reads the quaternion. Ill-conditioned, mirrored or nonorthogonal columns need not yield a unit result.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass reads three columns. Basis completion only runs for missing axes, and the trace selects a single formula for the quaternion.
