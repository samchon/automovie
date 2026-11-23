# src/cinematics/IAutoMovieCameraClearanceObstacleState.ts#IAutoMovieCameraClearanceObstacleState

## @evidence contracts/development/design.md#principled-representation

A stable scene-node id pairs with an inclusive world-axis box in metres; the evaluator rejects nonfinite or inverted bounds and duplicate ids within a sample.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Clearance sampling and evaluation exchange the existing box contract without copying scene nodes or mesh geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The box is an obstacle bound rather than an exact surface; matching identities across samples and intersample containment remain necessary.

## @evidence contracts/development/common.md#meaningful-documentation

Documents stable identity, world coordinates, inclusive bounds and their admission owner.
