# src/human/generation/IAutoMovieHumanAperturePocket.ts#IAutoMovieHumanAperturePocket.LoopEmit

## @evidence contracts/development/common.md#meaningful-documentation

Emit consecutive triangle corner indices under their owning chain name; each group of three corners is one triangle in the mesh buffers being extended by the aperture-pocket caller. The sink owns the index/group side effects; it does not receive point coordinates.

## @evidence contracts/development/design.md#principled-representation

Emit consecutive triangle corner indices under their owning chain name; each group of three corners is one triangle in the mesh buffers being extended by the aperture-pocket caller. The sink owns the index/group side effects; it does not receive point coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanAperturePocket.LoopEmit is the canonical exchange used by AutoMovieHumanAperturePocket.loop.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanAperturePocket input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
