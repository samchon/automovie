# src/material/IAutoMovieMaterial.ts#IAutoMovieMaterial

## @evidence contracts/development/design.md#principled-representation

Metallic, roughness and linear colour describe the base reflectance model and the anisotropy, sheen, specular and volume lobes restate their glTF extension parameters; `validateModel` admits their domains, and `buildMaterial` maps the admitted fields to physical material parameters and separately composes the optional shader effects.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One optical record owns reflectance, alpha, lobes and texture slots, each multi-parameter lobe grouped in one optional record; physical density and construction layers use separate substance and assembly types, and image bytes stay behind image or asset references.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No finish name selects a numerical preset; explicit alpha mode overrides opacity-derived defaults. Shader approximations make no measured subsurface-response claim, and lobe omission keeps the renderer's neutral value rather than a guessed finish.

## @evidence contracts/development/common.md#meaningful-documentation

States coefficient bounds, linear colour, texture slot colour and channel roles, alpha defaults, normal-map composition, lobe directions and omission defaults, metre-valued transmission and subsurface properties, image resolution order and resolver ownership, and that a procedural surface replaces base colour and roughness and is refused beside the images stating them.
