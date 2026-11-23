# src/scene/resolveAutoMovieMaterialTexture.ts#resolveAutoMovieMaterialTexture

## @evidence contracts/development/implementation.md#principled-implementation

Uses the existing resolver-owned wrapper, establishes exclusive material/environment allocation ownership before writes, applies original decoding/UV/sampler configuration and acknowledges only supported binding writes plus one upload-version increment.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Binding normalization, native wrap/filter mapping and actual cache/environment history owners remain separate from texture loading and material construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing binding/resolver/asset stays null; uncontrolled history is not repaired by restoring fields and material/scene cannot own one wrapper simultaneously. Resolver output and admitted binding shape are premises, not full image or native allocation proof.

## @evidence contracts/development/common.md#meaningful-documentation

Documents legacy texCoord0/color fallback, degree-to-radian UV rotation, material-use state exclusivity, resolver/cache-owned wrapper retirement and limited allocation receipt semantics.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed binding/property work delegates actual resolver loading/cache cost and marks the existing wrapper for upload without decoding or copying image bytes here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Decoded Source sharing can be reused through separate wrappers while binding-controlled state stays exclusive; supported receipt equivalence cannot repair prior uncontrolled version/fixed-input drift.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No renderer or new decoded image is acquired here; resolver/cache owns issued wrapper retirement, including configuration failure, while the material borrows the returned wrapper.
