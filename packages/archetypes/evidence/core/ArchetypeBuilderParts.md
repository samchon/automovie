# src/core/ArchetypeBuilderParts.ts#ArchetypeBuilderParts

## @evidence contracts/development/common.md#meaningful-documentation

States builder ownership and the handover at build, with each record's purpose.

## @evidence contracts/development/design.md#principled-representation

Geometry, optical material, relative mass and declared surface remain separate records over the same unique part ids. Explicit convex-cell records bind to the exact mesh geometry they generated.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Primitive and convex builder calls use one recorder; public fields are internal assembly state consumed by that builder's existing build/span/contact paths.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No producer identity selects geometry or physical behavior. Duplicate ids are refused across all representation kinds.

# src/core/ArchetypeBuilderParts.ts#ArchetypeBuilderParts.prototype.add

## @evidence contracts/development/common.md#meaningful-documentation

Defines geometry ownership, rigid placement and optional appearance/mass inputs.

## @evidence contracts/development/implementation.md#principled-implementation

Preserves the builder's existing exact colour normalization, unit scale and explicit density/share/surface semantics for both primitive and convex parts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Refuse duplicate id, share its colour material, record optional physical data, then append the placed part.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never renames ids, adds a proxy solid or derives a physical material from colour.

## @evidence contracts/development/implementation.md#efficient-algorithms

Duplicate-id scan is linear in the existing P parts; the remaining work is constant and geometry is retained without cloning.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Normalized colour and opacity share equal optical materials within this builder. Geometry and mass facts are shared with the built model.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The builder owns these finite part/material/data records and hands them over at build. No process, external handle or cross-model cache is acquired.
