# src/human/generation/conic/IAutoMovieHumanLandmarkSurface.ts#IAutoMovieHumanLandmarkSurface

## @evidence contracts/development/design.md#principled-representation

A base frame and a side reader describe the field derived by AutoMovieHumanLandmarkSurface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the result read by the Human armscye, thumb root and reference fitter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reading derives from the supplied landmarks and the same oriented plane for both sides.

## @evidence contracts/development/common.md#meaningful-documentation

Members give the figure frame, projection, direction and units.

# src/human/generation/conic/IAutoMovieHumanLandmarkSurface.ts#IAutoMovieHumanLandmarkSurface.ISurface

## @evidence contracts/development/design.md#principled-representation

A figure-space origin in millimetres and an oriented unit normal define the base plane. The side callback reads the landmark surface at a figure-space point. The runtime admits the landmarks and normal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The landmark producer returns the same field that the joint division and fitted attachment use.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The result stores the frame and one field, leaving the intersection with a skin to its caller.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the origin's projection, the normal's orientation and the distance measured by the callback.
