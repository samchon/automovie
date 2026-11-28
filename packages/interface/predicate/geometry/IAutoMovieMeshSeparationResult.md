# src/geometry/IAutoMovieMeshSeparationResult.ts#IAutoMovieMeshSeparationResult

## @evidence contracts/development/common.md#meaningful-documentation

Conservative full-query receipt with certification, threshold-capped distance, source witness, work and attachment caps.

## @evidence contracts/development/design.md#principled-representation

The walk combines box and convex separation bounds with per-support contact caps. A failed proof can come from contact, crossing or finite rounding at the clearance limit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The receipt keeps attained lower bound and support caps distinct. A closest-point or penetration query needs different geometric evidence.

# src/geometry/IAutoMovieMeshSeparationResult.ts#IAutoMovieMeshSeparationResult.certified

## @evidence contracts/development/common.md#meaningful-documentation

Whether the complete feature passed the requested proof. An attachment query can certify with a reported `lowerBound` of zero.

# src/geometry/IAutoMovieMeshSeparationResult.ts#IAutoMovieMeshSeparationResult.lowerBound

## @evidence contracts/development/common.md#meaningful-documentation

Proved metre lower bound capped at requested clearance. A detached strict-zero success reports Number.MIN_VALUE and an attached query reports zero.

# src/geometry/IAutoMovieMeshSeparationResult.ts#IAutoMovieMeshSeparationResult.triangle

## @evidence contracts/development/common.md#meaningful-documentation

Original resident ordinal that supplied the smallest below-target bound, with ties by lower ordinal. A failed attachment cap takes its support ordinal; -1 means no such witness.

# src/geometry/IAutoMovieMeshSeparationResult.ts#IAutoMovieMeshSeparationResult.examined

## @evidence contracts/development/common.md#meaningful-documentation

Count of work units spent by this completed call, including seat, support and hierarchy work it performed.

# src/geometry/IAutoMovieMeshSeparationResult.ts#IAutoMovieMeshSeparationResult.attachmentCaps

## @evidence contracts/development/common.md#meaningful-documentation

Proved contact caps in supplied support order, stopping at a failed support proof. An unattached query returns an empty array.
