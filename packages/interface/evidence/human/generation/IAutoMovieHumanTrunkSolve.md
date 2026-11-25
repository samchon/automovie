# src/human/generation/IAutoMovieHumanTrunkSolve.ts#IAutoMovieHumanTrunkSolve.IJet

## @evidence contracts/development/common.md#meaningful-documentation

A scalar function's value with its first two derivatives.

## @evidence contracts/development/design.md#principled-representation `value`: The value. `slope`: The first derivative. `curvature`: The second derivative.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmRootOval.outline, AutoMovieHumanTrunkSolve.quintic. Read by AutoMovieHumanShoulderCap.create, AutoMovieHumanTrunkSolve.quintic. Also types AutoMovieHumanShoulderCap.low, AutoMovieHumanShoulderLine.low.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `value`, `slope`, `curvature`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanTrunkSolve.ts#IAutoMovieHumanTrunkSolve.BisectF

## @evidence contracts/development/common.md#meaningful-documentation

The root of a monotone function over an interval.

## @evidence contracts/development/design.md#principled-representation

The root of a monotone function over an interval. The callable takes x and returns number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkSolve.BisectF is the canonical exchange used by AutoMovieHumanTrunkSolve.bisect.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkSolve.bisect for the root of a monotone function over an interval.

# src/human/generation/IAutoMovieHumanTrunkSolve.ts#IAutoMovieHumanTrunkSolve.JetF

## @evidence contracts/development/common.md#meaningful-documentation

A function with its first two derivatives by central differences over 0.05 mm: the displacements are smooth closed forms, so the differences carry the derivatives the sector joins need.

## @evidence contracts/development/design.md#principled-representation

A function with its first two derivatives by central differences over 0.05 mm: the displacements are smooth closed forms, so the differences carry the derivatives the sector joins need. The callable takes z and returns number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkSolve.JetF is the canonical exchange used by AutoMovieHumanTrunkSolve.jet.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkSolve.jet for a function with its first two derivatives by central differences over 0.05 mm: the displacements are smooth closed forms, so the differences carry the derivatives the sector joins need.

# src/human/generation/IAutoMovieHumanTrunkSolve.ts#IAutoMovieHumanTrunkSolve.JetResult

## @evidence contracts/development/common.md#meaningful-documentation

A function with its first two derivatives by central differences over 0.05 mm: the displacements are smooth closed forms, so the differences carry the derivatives the sector joins need.

## @evidence contracts/development/design.md#principled-representation

A function with its first two derivatives by central differences over 0.05 mm: the displacements are smooth closed forms, so the differences carry the derivatives the sector joins need. The callable takes z and returns [number, number, number].

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkSolve.JetResult is the canonical exchange used by AutoMovieHumanTrunkSolve.jet.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkSolve.jet for a function with its first two derivatives by central differences over 0.05 mm: the displacements are smooth closed forms, so the differences carry the derivatives the sector joins need.
