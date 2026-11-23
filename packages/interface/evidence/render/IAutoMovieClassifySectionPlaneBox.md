# src/render/IAutoMovieClassifySectionPlaneBox.ts#IAutoMovieClassifySectionPlaneBox.IProps

## @evidence contracts/development/design.md#principled-representation

Finite ordered world-metre box corners and a readonly plane list define one inclusive half-space classification; an empty list keeps the box.

## @evidence contracts/development/design.md#minimal-and-owned-surface

classifyAutoMovieSectionPlaneBox reuses shared vectors and section-plane records independently of authored camera frusta.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Invalid box/plane input throws; floating boundary arithmetic remains numerical and section classification is not delivery visibility.

## @evidence contracts/development/common.md#meaningful-documentation

Documents world units, inclusive zero distance, empty planes and numerical limits.
