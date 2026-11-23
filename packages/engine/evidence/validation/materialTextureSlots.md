# src/validation/materialTextureSlots.ts#materialTextureSlots

## @evidence contracts/development/implementation.md#principled-implementation

Enumerate present baseColor, metalRough, normal, detailNormal, occlusion, emissive and thickness bindings, the anisotropy direction binding, then overlay color/normal bindings, carrying exact suffixes and decoding intent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single slot catalog feeds model, scale and ledger validators instead of independent path menus.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Absent bindings and a non-record anisotropy are skipped; malformed bindings are not repaired, and anisotropy and overlay record admission belongs to the material validator.

## @evidence contracts/development/common.md#meaningful-documentation

Rows carry borrowed bindings, caller-relative paths and srgb/linear intent in table order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed own and anisotropy slots plus O(O) overlays produce O(T) fresh slot wrappers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All texture consumers share this catalog; changed material contents are enumerated anew.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns wrappers while the material owns borrowed bindings; no texture bytes or GPU handles are retained.
