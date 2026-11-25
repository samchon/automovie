# src/pose/IAutoMovieMarkBalance.ts#IAutoMovieMarkBalance.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Documents world support geometry, path-derived mark ids and the empty-support error.

## @evidence contracts/development/design.md#principled-representation

XZ defines support convexity while world y is preserved for drawing; finite coordinates are caller premises and nonempty support is checked by markAutoMovieBalance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mark producer borrows these inputs to draw centre and support marks and flag a negative stability margin.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The centre can be ordinary or extrapolated centre of mass; the mark layer does not impose a motion-specific balance model.
