# src/props/AutoMovieArchetypeSpoon.ts#AutoMovieArchetypeSpoon.create

## @evidence contracts/development/common.md#meaningful-documentation

Explains the flat bowl proxy, its normal, the grip and the seedless measurements.

## @evidence contracts/development/implementation.md#principled-implementation

The cylindrical handle ends at the near bowl rim, and the bowl disc's far edge reaches the drawn length. Its outer face points toward positive Z.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses one dimension draw, then constructs one handle, one bowl disc and their contact frames.

# src/props/AutoMovieArchetypeSpoon.ts#AutoMovieArchetypeSpoon.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the grip and the outward bowl contact with their opposing approach directions.

## @evidence contracts/development/design.md#principled-representation

The `grip` faces negative Z near the work end, while the bowl contact faces positive Z from the bowl's centre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exposes just the two semantic contacts created by the spoon.

# src/props/AutoMovieArchetypeSpoon.ts#AutoMovieArchetypeSpoon.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Names the Y length, handle diameter and whole spoon mass with physical units.

## @evidence contracts/development/design.md#principled-representation

Drawn length includes the bowl and uses metres. The diameter sets the grip aperture and mass uses kilograms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three keys describe the measured values the spoon builder reads.
