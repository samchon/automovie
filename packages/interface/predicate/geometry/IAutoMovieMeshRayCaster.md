# src/geometry/IAutoMovieMeshRayCaster.ts#IAutoMovieMeshRayCaster

## @evidence contracts/development/common.md#meaningful-documentation

The callable record gives the shared frame, normalized travel, inclusive bounds, default and unbounded maximum, and meaning of a miss.

## @evidence contracts/development/design.md#principled-representation

All three entry points admit finite coordinates, nonzero direction, finite minimum and safe original exclusions before traversal. An infinite maximum remains unbounded. The nearest operations retain minimum travel with ordinal tie-breaking. Blocked stops at the first admitted hit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One caster retains a copied resident snapshot and scratch stack. The caller selects distance, hit identity or existence per query.

# src/geometry/IAutoMovieMeshRayCaster.ts#IAutoMovieMeshRayCaster.nearest

## @evidence contracts/development/common.md#meaningful-documentation

The query returns the raw nearest travel in metres, including negative zero, or null.

# src/geometry/IAutoMovieMeshRayCaster.ts#IAutoMovieMeshRayCaster.nearestHit

## @evidence contracts/development/common.md#meaningful-documentation

The query pairs the nearest travel with an original triangle ordinal and returns a fresh record, breaking ties by the smallest ordinal.

# src/geometry/IAutoMovieMeshRayCaster.ts#IAutoMovieMeshRayCaster.blocked

## @evidence contracts/development/common.md#meaningful-documentation

The query yields a boolean and may stop at the first admitted hit in traversal order.
