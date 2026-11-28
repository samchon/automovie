# src/geometry/IAutoMovieMeshRayHit.ts#IAutoMovieMeshRayHit

## @evidence contracts/development/common.md#meaningful-documentation

The return defines owned travel in the local metre frame and an original source ordinal.

## @evidence contracts/development/design.md#principled-representation

The cast preserves output triangle identity through its hierarchy order and chooses the lowest original ordinal for equal travel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The hit contains the travel and face identity. Its query owns the direction, interval and exclusions.

# src/geometry/IAutoMovieMeshRayHit.ts#IAutoMovieMeshRayHit.distance

## @evidence contracts/development/common.md#meaningful-documentation

The raw intersection travel is in metres along the normalized direction, inside the requested interval and retaining a possible signed zero.

# src/geometry/IAutoMovieMeshRayHit.ts#IAutoMovieMeshRayHit.triangle

## @evidence contracts/development/common.md#meaningful-documentation

The index is the original triangle triplet ordinal and chooses the lowest ordinal at equal travel.
