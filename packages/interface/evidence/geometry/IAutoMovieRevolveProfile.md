# src/geometry/IAutoMovieRevolveProfile.ts#IAutoMovieRevolveProfile.IProps

## @evidence contracts/development/design.md#principled-representation

Profile x is nonnegative radius and y is height in metres; angular segments count one complete turn.

## @evidence contracts/development/design.md#minimal-and-owned-surface

revolveAutoMovieProfile consumes the ordered profile and emits new mesh buffers with metric UVs and a duplicated seam.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer checks at least two finite profile points and a safe-integer segment count of at least three; closure, orientation and self-intersections remain properties of the authored meridian.

## @evidence contracts/development/common.md#meaningful-documentation

An authored meridian and angular sampling count for a local-Y surface of revolution. Profile x is nonnegative radius and y is height in metres; angular segments count one complete turn.
