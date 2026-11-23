# src/geometry/IAutoMovieArcLengthJet.ts#IAutoMovieArcLengthJet

## @evidence contracts/development/design.md#principled-representation

Regular arc-length derivatives remove source parameter speed while preserving point, oriented unit tangent and geometric curvature; zero-speed output is explicitly a degenerate numerical convention.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Human seam publication and chord-arc endpoints share this geometric jet rather than repeating identical point/tangent/curvature records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Arbitrary-parameter jets and surface partial derivatives remain different contracts; array dimensions are a caller premise rather than a cast guarantee.

## @evidence contracts/development/common.md#meaningful-documentation

States units, frame, equal dimensions, orientation, orthogonality, mutation and the regular-curve premise.
