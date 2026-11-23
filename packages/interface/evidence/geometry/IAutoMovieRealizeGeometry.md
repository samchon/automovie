# src/geometry/IAutoMovieRealizeGeometry.ts#IAutoMovieRealizeGeometry.IResult

## @evidence contracts/development/design.md#principled-representation

Mesh coordinates are model-local metres; complete describes recipe processing rather than embedding, source fidelity or watertightness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

realizeAutoMovieGeometry shares one dispatch for drawing, framing and measurement; existing meshes are borrowed and generated buffers transfer to the caller.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Display requests may receive incomplete finite atlases; an explicit complete requirement throws on incomplete processing, while source-fit diagnostics can remain on complete output.

## @evidence contracts/development/common.md#meaningful-documentation

Finite mesh output and processing diagnostics for a public geometry recipe. Mesh coordinates are model-local metres; complete describes recipe processing rather than embedding, source fidelity or watertightness.
