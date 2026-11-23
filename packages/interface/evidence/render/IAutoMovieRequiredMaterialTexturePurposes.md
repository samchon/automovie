# src/render/IAutoMovieRequiredMaterialTexturePurposes.ts#IAutoMovieRequiredMaterialTexturePurposes.IProps

## @evidence contracts/development/design.md#principled-representation

Borrowed used materials and explicit default-PBR/area-light booleans determine implicit texture roles without allocation sizes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

requiredMaterialTexturePurposes consumes canonical materials and the two scope facts needed for reachable lookup textures.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A declared zero subsurface radius still requires a lookup; role presence cannot certify pixels, native allocation or bytes.

## @evidence contracts/development/common.md#meaningful-documentation

Documents physically based reachability and the absence of implicit boolean defaults.
