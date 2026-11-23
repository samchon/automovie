# src/geometry/IAutoMovieMeshAttachmentCap.ts#IAutoMovieMeshAttachmentCap

## @evidence contracts/development/design.md#principled-representation

The cap is `boundAutoMovieTriangleAttachmentContact`'s barycentric bound, root deficit over deficit plus corner gap times the largest corner L1 distance, with every step rounded outward, so it encloses every contact point rather than sampling a nearest one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The separation query keeps only the support ordinal and the cap from the full contact bound, because a caller needs where contact may occur and how far it may reach, not the intermediate gap and deficit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A cap is pushed only after the bound proved a positive corner gap; an unproved support ends the query uncertified instead of reporting a zero or default cap.

## @evidence contracts/development/common.md#meaningful-documentation

States that `triangle` is the original resident ordinal, that `cap` is an outward-rounded metre bound from the registered root, and that the cap licenses no other contact.
