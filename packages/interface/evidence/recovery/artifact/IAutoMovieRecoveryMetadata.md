# src/recovery/artifact/IAutoMovieRecoveryMetadata.ts#IAutoMovieRecoveryMetadata

## @evidence contracts/development/common.md#meaningful-documentation

States the extension-field purpose, caller ownership, unknown-value narrowing and own-property reader boundary.

## @evidence contracts/development/design.md#principled-representation

A string-keyed unknown-value record represents heterogeneous provenance fields without claiming their shape or numerical authority.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Artifact, coverage and mesh-frontier contracts share this extension bag; known coverage fields remain explicitly typed by their owning contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unknown preserves the need to narrow each extension field; it supplies neither a cast to geometry nor a blanket promise that values can be serialized.
