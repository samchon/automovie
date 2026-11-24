# src/human/generation/IAutoMovieHumanSurfaceContext.ts#IAutoMovieHumanSurfaceContext

## @evidence contracts/development/common.md#meaningful-documentation

Mutable buffers and shared boundary ownership for one body generation, including its web paths, slit indices and analytic dome normals.

## @evidence contracts/development/design.md#principled-representation `mesh`: Skin buffers shared by all chains, in calibration millimetres. `chains`: Calibration chains indexed by their source graph identity. `events`: Parent/child contact events.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanBodySurfaceContact.contact, AutoMovieHumanBodySurfaceLoft.loft, AutoMovieHumanBodySurfaceLoft.join. Also types AutoMovieHumanBodySurface.context.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies the mesh and all its working buffers. Web paths, slit indices and analytic dome normals belong to that same invocation and are read directly by the final construction and normal publishers.
