# src/worldBlock.ts#worldBlock

## @evidence contracts/development/implementation.md#principled-implementation

Half-extents around the base XZ and baseY plus half-height place the same box dimensions the model's single part draws; the color is decoded from sRGB to linear by the shared decoder, and runtime identity uses the canonical model-id owner. Finite input fields do not universally keep derived additions representable.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One constructor joins model, node and bounds from the same size; the box model is built in place because `engine` cannot depend on the archetype catalogue, and it carries no LOD or registry indirection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Blank id, nonpositive/nonfinite enumerated sizes, nonfinite base and non-hex color throw before output. Typed vector shape is a premise; missing fields are not total unknown-payload admission here.

## @evidence contracts/development/common.md#meaningful-documentation

Documents metre base/size, centered box placement, the #RRGGBB color decoded into one material, the shared runtime model id and fresh result ownership; the helper itself has test-only repository reach.

## @evidence contracts/development/implementation.md#efficient-algorithms

For fixed vector fields, arithmetic and output size are constant plus id/color string work; the box is one primitive part, so declared volume allocates no mesh or render resources.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same supplied dimensions feed the part, translation and bounds within the call; no cheap scalar result cache or separately tunable extent is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns fresh model/node/bounds records; no builder registry, renderer or background task is acquired.
