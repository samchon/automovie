# src/geometry/IAutoMoviePreparedSurface.ts#IAutoMoviePreparedSurface

## @evidence contracts/development/common.md#meaningful-documentation

Prepared outer and hole footprint for repeated XZ containment of one authored surface.

## @evidence contracts/development/design.md#principled-representation

Preparation copies planar footprint coordinates and signed areas while retaining the original surface for identity and height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The prepared record owns its footprint data and borrows the authored surface. Height and walkability stay with the source owners.

# src/geometry/IAutoMoviePreparedSurface.ts#IAutoMoviePreparedSurface.surface

## @evidence contracts/development/common.md#meaningful-documentation

Original surface reference used for its ID and current height rule.

# src/geometry/IAutoMoviePreparedSurface.ts#IAutoMoviePreparedSurface.footprint

## @evidence contracts/development/common.md#meaningful-documentation

Prepared planar outer and hole rings with signed areas. Concavity and holes participate in later containment.
