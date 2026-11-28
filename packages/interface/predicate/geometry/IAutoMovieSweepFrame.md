# src/geometry/IAutoMovieSweepFrame.ts#IAutoMovieSweepFrame

## @evidence contracts/development/common.md#meaningful-documentation

Right-handed orthonormal section plane located at a spine point in model space.

## @evidence contracts/development/design.md#principled-representation

The frame reader emits a metre origin and the transported or station-rotated axes. A local section point is lifted as origin plus its X and Y components times their corresponding axes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four vectors carry placement and orientation. The section owns its local coordinates and the sweep owns transport.

# src/geometry/IAutoMovieSweepFrame.ts#IAutoMovieSweepFrame.origin

## @evidence contracts/development/common.md#meaningful-documentation

Model-space spine point in metres at the selected chord coordinate.

# src/geometry/IAutoMovieSweepFrame.ts#IAutoMovieSweepFrame.x

## @evidence contracts/development/common.md#meaningful-documentation

Unit first axis of the section plane and the zero direction for polar evaluation.

# src/geometry/IAutoMovieSweepFrame.ts#IAutoMovieSweepFrame.y

## @evidence contracts/development/common.md#meaningful-documentation

Unit second axis of the section plane and the quarter-turn direction for polar evaluation.

# src/geometry/IAutoMovieSweepFrame.ts#IAutoMovieSweepFrame.normal

## @evidence contracts/development/common.md#meaningful-documentation

Unit right-handed cross product of the section X and Y axes. With an unrotated transported plane it follows the spine tangent.
