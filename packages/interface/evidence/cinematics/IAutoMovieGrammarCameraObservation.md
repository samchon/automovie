# src/cinematics/IAutoMovieGrammarCameraObservation.ts#IAutoMovieGrammarCameraObservation

## @evidence contracts/development/design.md#principled-representation

A pinhole camera: subjects are projected to normalized device coordinates with `halfY = tan(fovY / 2)` vertically and `halfY * aspect` horizontally, the standard perspective projection, so measured shot sizes and screen directions are read in the frame's own coordinates; the premise is a camera looking down its local `-Z`, the glTF convention `projectToNdc` applies, and a point at or behind the lens yields no measurement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extends the resolved placement with only the two lens facts projection needs, so the same placement type serves camera resolution and the grammar read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default lens or aspect is substituted for an invalid one; the analyzer refuses the input instead of reading a frame no camera could produce.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and when it samples, the units and valid ranges of both lens fields, and the failure effect of an invalid value.
