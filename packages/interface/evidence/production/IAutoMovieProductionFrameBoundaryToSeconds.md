# src/production/IAutoMovieProductionFrameBoundaryToSeconds.ts#IAutoMovieProductionFrameBoundaryToSeconds.IProps

## @evidence contracts/development/design.md#principled-representation

frame is a nonnegative safe integer boundary and frameRate is rational frames per second; the result is frame * denominator / numerator seconds after rate reduction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

productionFrameBoundaryToSeconds gives effect ownership and sampling one common floating-point boundary value rather than independently multiplying by fps.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Input admission throws on invalid boundaries/rates. Above the exact-integer product range the multiplication rounds, so this contract does not promise arbitrary-precision seconds.

## @evidence contracts/development/common.md#meaningful-documentation

Film boundary and rational frame rate for the common seconds conversion. frame is a nonnegative safe integer boundary and frameRate is rational frames per second; the result is frame * denominator / numerator seconds after rate reduction.
