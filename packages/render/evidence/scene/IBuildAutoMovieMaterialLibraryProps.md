# src/scene/IBuildAutoMovieMaterialLibraryProps.ts#IBuildAutoMovieMaterialLibraryProps

## @evidence contracts/development/design.md#principled-representation

Complete model declarations and requested material ids admit one definition per identity before runtime construction, with an optional already-owned shot cache providing decoded texture bindings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates cross-model identity search, borrowing-surface demand and texture ownership in the three inputs the library builder requires.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Equal repeated declarations are allowed but conflicts refuse; null means renderer default while blank ids and missing textured cache cannot silently choose a fallback.

## @evidence contracts/development/common.md#meaningful-documentation

Documents model borrowing, duplicate/conflict semantics, requested id deduplication and texture-cache requirements and ownership.
