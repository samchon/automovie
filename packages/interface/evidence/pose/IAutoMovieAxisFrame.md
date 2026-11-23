# src/pose/IAutoMovieAxisFrame.ts#IAutoMovieAxisFrame

## @evidence contracts/development/design.md#principled-representation

Represent clinical=sign*rig+neutral in degrees, with sign plus/minus one and finite neutral admitted by scalar/interval conversion owners.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A per-axis affine record separates rest orientation from clinical convention without changing units.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Typing alone enforces no runtime finiteness; omitted frames mean identity and null angles preserve rest in converters.

## @evidence contracts/development/common.md#meaningful-documentation

Members state mirrored sign and clinical rest angle in degrees with conversion admission identified.
