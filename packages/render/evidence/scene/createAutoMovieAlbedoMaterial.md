# src/scene/createAutoMovieAlbedoMaterial.ts#createAutoMovieAlbedoMaterial

## @evidence contracts/development/implementation.md#principled-implementation

Builds a three.js `MeshBasicMaterial`, which is unlit, from the original's `color` factor, `map`, `alphaMap` and vertex-colour flag, so the drawn colour is the glTF base colour (factor times texel) the beauty pass shades. The factor is cloned in the linear working space `buildMaterial` stores it in, and `toneMapped` false removes tone mapping and exposure, so the renderer's sRGB output conversion is the only transfer applied; the texture keeps its own sRGB colour space and is decoded when sampled. Coverage copies `visible`, `alphaTest`, `side` and, for a cutout, the opacity the test reads; every other surface is drawn opaque with depth writes. A material without a `color` factor has no base colour to read and is drawn black. Overlays, emission and other lobes are outside the base colour and are not drawn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function maps one original material to its override; `overrideAutoMovieRenderModeMaterials` owns the per-mesh swap, material-group slots, formation-cycle and skinning patches and restoration, and `applyRenderMode` owns the atmosphere and background suspension, so this function decides only colour and coverage.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The output encoding is the renderer's own conversion rather than a hand-applied curve, and no value is tuned: every field is copied from the original or fixed by the pass definition (opaque, unlit, untoned). The black fallback for a material without a base colour is a stated rule, not a special case of any scene. Only a widening read of optional fields is cast, and each is checked with `instanceof` before use.

## @evidence contracts/development/common.md#meaningful-documentation

States the drawn colour, the single sRGB encoding with its `(1, 0, 0)` example, the coverage rule for hidden, cutout and translucent surfaces, the black fallback, what is not drawn, and that the caller owns the result while the original is only read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per material: one material object and one colour clone; textures are shared by reference, not copied or re-uploaded.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Texture objects are shared with the original because the pass reads the same texels; the material itself is not shared, since each original's factor, cutout and side decide its override and the caller disposes each override once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one material the caller owns and disposes; it borrows the original's textures without taking ownership, so disposing the override leaves the textures to their owner.
