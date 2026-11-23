# src/environment/IAutoMovieFurnishingPiece.ts#IAutoMovieFurnishingPiece

## @evidence contracts/development/design.md#principled-representation

A rigid model, a placement relation and optional floor clearances; the producer measures the model's rest box and resolves both in the room frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`createFurnishedRoom.IParams.pieces` holds these by role. The model reuses the common model type, so its affordances surface as `<role>/<affordance id>`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No measured size is restated by the author; a layout override of the role replaces only the placement.

## @evidence contracts/development/common.md#meaningful-documentation

States how the model is measured, what `place` and `clear` do and how an override interacts.
