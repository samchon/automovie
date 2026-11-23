# src/render/IAutoMovieRenderAndSeeResult.ts#IAutoMovieRenderAndSeeResult

## @evidence contracts/development/design.md#principled-representation

Extending the clip outcome adds the requested duration and a shallow spec snapshot without altering captured frame identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The inheritance keeps encoded paths and frame metadata in the existing render result while this envelope owns inspection inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The artifact records the supplied duration rather than inferring authored runtime from the encoder's output.

## @evidence contracts/development/common.md#meaningful-documentation

Its added properties state the capture spec and requested seconds, while inherited result members define paths and frame metadata.
