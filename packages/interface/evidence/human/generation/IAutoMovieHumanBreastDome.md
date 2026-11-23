# src/human/generation/IAutoMovieHumanBreastDome.ts#IAutoMovieHumanBreastDome

## @evidence contracts/development/common.md#meaningful-documentation

Describes breast frame and footprint inputs and sampled body-point grids in millimetres; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Breast frame and footprint inputs and sampled body-point grids in millimetres. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanBreastDome; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing BreastDome contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanBreastDome.ts#IAutoMovieHumanBreastDome.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the dome reads.

## @evidence contracts/development/design.md#principled-representation `frame`: The breast's frame. `footprint`: The footprint. `projection`: The bust point's projection, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanBreastDome.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frame`, `footprint`, `projection`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBreastDome.ts#IAutoMovieHumanBreastDome.SurfaceResult

## @evidence contracts/development/common.md#meaningful-documentation

Sample grid of body-frame [x, y, z] points in millimetres. Rows advance along the breast frame's up axis and columns along its lateral axis; this is the isolated dome display surface.

## @evidence contracts/development/design.md#principled-representation

Sample grid of body-frame [x, y, z] points in millimetres. Rows advance along the breast frame's up axis and columns along its lateral axis; this is the isolated dome display surface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBreastDome.SurfaceResult is the canonical exchange used by AutoMovieHumanBreastDome.surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanBreastDome input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
