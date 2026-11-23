# src/render/picture/IAutoMovieRasterPoint.ts#IAutoMovieRasterPoint

## @evidence contracts/development/design.md#principled-representation

This pixel coordinate is distinct from a world-space vector.

## @evidence contracts/development/design.md#minimal-and-owned-surface

stampAutoMovieRasterLabel exchanges x, y; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This pixel coordinate is distinct from a world-space vector.

## @evidence contracts/development/common.md#meaningful-documentation

Top-left pixel anchor for a raster label. stampAutoMovieRasterLabel measures x rightward and y downward from the image origin, rounds the anchor and moves the label box back inside the image before clipping oversized content. The prose and members document how stampAutoMovieRasterLabel interprets and admits these values.
