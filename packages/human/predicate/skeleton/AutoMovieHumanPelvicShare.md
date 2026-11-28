# src/skeleton/AutoMovieHumanPelvicShare.ts#AutoMovieHumanPelvicShare.SHARE

## @evidence contracts/development/common.md#meaningful-documentation

The declaration distinguishes the chosen dimensionless share from the extension limit that can cap the resulting posterior tilt.

# src/skeleton/AutoMovieHumanPelvicShare.ts#AutoMovieHumanPelvicShare.EXTENSION

## @evidence contracts/development/common.md#meaningful-documentation

The declaration states the unit and points to the measured range's owning channel instead of repeating a second constant.

# src/skeleton/AutoMovieHumanPelvicShare.ts#AutoMovieHumanPelvicShare.tilt

## @evidence contracts/development/common.md#meaningful-documentation

The source identifies both anatomical inputs, the backward degree output and the extension cap.

## @evidence contracts/development/implementation.md#principled-implementation

Take the smaller of the chosen share of the larger flexion and the smaller flexion plus the canonical extension allowance. Clamp the result at zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed arithmetic expression uses the shared constants and only the supplied scalars. No pose or population data is retained.

# src/skeleton/AutoMovieHumanPelvicShare.ts#AutoMovieHumanPelvicShare.joint

## @evidence contracts/development/common.md#meaningful-documentation

The declaration specifies the other thigh's position, units and behavior for flexion and extension.

## @evidence contracts/development/implementation.md#principled-implementation

The positive branch subtracts the existing bilateral tilt evaluated with the other thigh at zero. The remaining branch returns the stated clinical angle.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one call to the closed-form tilt calculation supplies the result. There are no additional inputs or collections.
