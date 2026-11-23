# src/scene/IAutoMovieCamera.ts#IAutoMovieCamera

## @evidence contracts/development/design.md#principled-representation

World TRS and perspective field/clip parameters define the film camera, while explicit standard depth precision and optional physical clearance contracts are evaluated against the current scene before take publication.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Delivery viewpoint and its physical constraints stay on the camera; inspection-owned section planes remain separate because their cutaway observations are not delivered-shot evidence.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Near must be positive and far exceed near, missing depth capability cannot be assumed, and a cutaway inspection cannot satisfy film visibility by removing an authored wall.

## @evidence contracts/development/common.md#meaningful-documentation

Defines world placement and local viewing direction, degree FOV, meter clips, explicit depth precision, optional legacy clearance and inspection-only cutaways.
