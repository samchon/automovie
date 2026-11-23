# src/human/generation/trunk/IAutoMovieHumanTrunkAxis.ts#IAutoMovieHumanTrunkAxis

## @evidence contracts/development/common.md#meaningful-documentation

A canonical metre axis and its original calibration-millimetre back outline in the same source clock. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanTrunkAxis exchanges the named IResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/trunk/IAutoMovieHumanTrunkAxis.ts#IAutoMovieHumanTrunkAxis.IResult

## @evidence contracts/development/common.md#meaningful-documentation

One declaration shared by the original part and production tree.

## @evidence contracts/development/design.md#principled-representation `axis`: Fixed +X/+Z level planes; coordinate lengths and endpoint stations are metres. `back`: Actual world-back declaration, calibration mm, in the radial source parameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkAxis.create. Also types AutoMovieHumanTrunkViewPart.axis.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `axis`, `back`; callers supply the complete record.
