# src/props/AutoMovieArchetypeToothbrush.ts#AutoMovieArchetypeToothbrush.create

## @evidence contracts/development/common.md#meaningful-documentation

Explains the 28 millimetre bristle head, upward work surface, handle grasp and default size.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the common cylindrical handle and rectangular head constructor with a 28 millimetre head and model-matched width.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw and one two-part head construction produce both contacts.

# src/props/AutoMovieArchetypeToothbrush.ts#AutoMovieArchetypeToothbrush.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Power `grip` at the handle midpoint and upward `face` on the bristle head.

## @evidence contracts/development/design.md#principled-representation

The grip spans the cylindrical handle and the independent face covers the bristle block.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The names reflect the physical grasp and working surface present on the model.

# src/props/AutoMovieArchetypeToothbrush.ts#AutoMovieArchetypeToothbrush.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Overall length along Z and handle diameter as `width`, in metres. Mass is in kilograms.

## @evidence contracts/development/design.md#principled-representation

Whole length contains the authored bristle block and the handle. Width determines the grip aperture.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three public keys record the size and mass values drawn from the toothbrush bands.
