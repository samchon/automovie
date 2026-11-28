# src/geometry/IAutoMovieMeshRayQueryOptions.ts#IAutoMovieMeshRayQueryOptions

## @evidence contracts/development/common.md#meaningful-documentation

The option describes valid original ordinals and query-local filtering without changing the ray or resident snapshot.

## @evidence contracts/development/design.md#principled-representation

The caster requires every exclusion to be a safe original triangle ordinal before traversal. It tests those same ordinals when visiting each candidate even after internal hierarchy reordering.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The option carries query-specific target exclusions only. The attachment owner supplies its own incident face identities.

# src/geometry/IAutoMovieMeshRayQueryOptions.ts#IAutoMovieMeshRayQueryOptions.excludedTriangles

## @evidence contracts/development/common.md#meaningful-documentation

The list identifies original ordinals ignored for that ray. Absent or empty sets leave the complete resident population eligible.
