# src/environment/AutoMovieFurnishingWall.ts#AutoMovieFurnishingWall

## @evidence contracts/development/design.md#principled-representation

A closed literal union names the four inner wall faces of a rectangular room by the room-frame axis and sign they close, so an invalid wall cannot be written. Distances are implied by the room's width and depth in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interface package owns it beside the furnishing layout. The `wall` relation names the wall a piece rests on, and the furnishing producer maps it to a heading, a run direction and the wall's inner face for the mount record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The four walls of a rectangle are the whole domain of the room frame; no wall of another shape is implied.

## @evidence contracts/development/common.md#meaningful-documentation

States the room frame and the plane of each wall's inner face.
