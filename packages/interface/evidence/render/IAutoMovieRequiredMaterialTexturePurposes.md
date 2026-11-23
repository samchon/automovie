# src/render/IAutoMovieRequiredMaterialTexturePurposes.ts#IAutoMovieRequiredMaterialTexturePurposes

## @evidence contracts/development/design.md#principled-representation

Material features and reachable rectangular lighting select lookup roles, independent of image dimensions or allocation identities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Borrowed materials and two explicit booleans are sufficient for the deduplicated role list.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A declared subsurface radius requires its lookup even at zero; the returned roles do not certify actual allocation or bytes.

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish default physically based surfaces, authored records and area-light presence with no implicit boolean defaults.

# src/render/IAutoMovieRequiredMaterialTexturePurposes.ts#IAutoMovieRequiredMaterialTexturePurposes.IProps

## @evidence contracts/development/design.md#principled-representation

Borrowed used materials and explicit default-PBR/area-light booleans determine implicit texture roles without allocation sizes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

requiredMaterialTexturePurposes consumes canonical materials and the two scope facts needed for reachable lookup textures.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A declared zero subsurface radius still requires a lookup; role presence cannot certify pixels, native allocation or bytes.

## @evidence contracts/development/common.md#meaningful-documentation

Documents physically based reachability and the absence of implicit boolean defaults.
