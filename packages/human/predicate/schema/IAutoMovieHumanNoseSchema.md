# src/schema/IAutoMovieHumanNoseSchema.ts#IAutoMovieHumanNoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The description names distinct landmarks for width, height and protrusion rather than relying on a camera or mesh frame.

## @evidence contracts/development/design.md#principled-representation

Typia applies [10, 70] millimetres for width, [15, 90] for height and [4, 45] for protrusion. These required scalar bounds leave feature construction to the receiving operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The face input reuses the Interface nose measurements through this alias. Its surface carries only the three distances used by the authored face record.
