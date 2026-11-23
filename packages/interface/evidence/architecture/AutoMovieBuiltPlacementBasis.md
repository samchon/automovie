# src/architecture/AutoMovieBuiltPlacementBasis.ts#AutoMovieBuiltPlacementBasis

## @evidence contracts/development/design.md#principled-representation `builtEnvironmentPlacementBounds` labels an element box by comparing its minimum and maximum on all three axes and labels every population box from `builtInstanceSetPlacementBounds`; `builtEnvironmentSupportStatus` labels a surface support `surface-height-rule`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four closed literals, one per resolution path, carried beside the box so overlap and support results report their own measurement quality without a second lookup.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A body without vertices is reported as a point with its own label instead of being given an invented extent, and the degenerate-box rule that also labels coincident drawn vertices is stated rather than hidden.

## @evidence contracts/development/common.md#meaningful-documentation

States what each basis measured, what a point basis means for overlaps and gaps, and the exact rule that assigns `element-origin-point`.
