# src/motion/composition/IAutoMovieZone.ts#IAutoMovieZone

## @evidence contracts/development/common.md#meaningful-documentation

Gives world metre geometry and clarifies that landmarks are absolute and need not be containment-checked.

## @evidence contracts/development/design.md#principled-representation

A zone has a centre and nonnegative radius for polar selection; finite geometry and unique intended ids are caller obligations, not resolver validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Production set descriptions own these values; resolveAutoMovieZone finds the first matching id and returns coordinate copies.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional landmarks add named points without introducing another competing definition of the centre or radius.
