# src/math/AutoMovieEngineMatrix3.ts#AutoMovieEngineMatrix3.skew

## @evidence contracts/development/common.md#meaningful-documentation

Names the cross-product order, finite input premise, output layout and length refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Writing the signed entries of the antisymmetric matrix makes its product with a column vector equal the right-handed cross product. Current admission checks length; callers must supply finite coordinates at each slot.

## @evidence contracts/development/implementation.md#efficient-algorithms

Six signed entries and three diagonal zeros are written directly to one array.

# src/math/AutoMovieEngineMatrix3.ts#AutoMovieEngineMatrix3.multiply

## @evidence contracts/development/common.md#meaningful-documentation

Names the matrix order, finite input premise, ownership and intermediate overflow policy.

## @evidence contracts/development/implementation.md#principled-implementation

Each result entry is one left row dotted with one right column. The routine checks input lengths and checks for signed infinity after each term and addition. A well-shaped NaN operand is outside the currently checked domain and can propagate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed loops perform 27 products and their additions, with one nine-element output and no per-row allocation.

# src/math/AutoMovieEngineMatrix3.ts#AutoMovieEngineMatrix3.transpose

## @evidence contracts/development/common.md#meaningful-documentation

Names the transposition, row-major format, finite input premise and fresh result.

## @evidence contracts/development/implementation.md#principled-implementation

Each output row copies the corresponding input column. Exact indexed copies preserve values, including signed zero. Current admission checks input length and leaves entry finiteness to the caller.

## @evidence contracts/development/implementation.md#efficient-algorithms

One literal copies nine entries into a new array without arithmetic.

# src/math/AutoMovieEngineMatrix3.ts#AutoMovieEngineMatrix3.apply

## @evidence contracts/development/common.md#meaningful-documentation

Names the matrix/vector shape, result tuple, finite premise and intermediate overflow policy.

## @evidence contracts/development/implementation.md#principled-implementation

Each coordinate is the dot product of an input row with the column vector. Lengths are checked first, and signed infinity from a product or partial sum is refused. NaN or a missing entry can propagate under the current length-only admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed loops evaluate nine products and sum them into one tuple, without converting the operands.
