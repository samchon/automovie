# src/human/generation/IAutoMovieHumanBodySurface.ts#IAutoMovieHumanBodySurface

## @evidence contracts/development/common.md#meaningful-documentation

Generated registered-frame skin buffers, material coordinates and opening rims in millimetres. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IOutput, GenerateDetails declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IOutput, GenerateDetails separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanBodySurface exchanges the named IOutput, GenerateDetails contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanBodySurface.ts#IAutoMovieHumanBodySurface.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Generated skin in millimetres, registered frame.

## @evidence contracts/development/design.md#principled-representation `mesh`: Skin buffers, triangles counter-clockwise from outside. `normals`: Flat unit vertex normals of the whole skin. `coordinates`: Loft coordinates of every vertex, flat `[chain, station, phase, ...]`: the index of the chain in the calibration that evaluated it, the station (height or tilted-frame station, mm) and the phase (radians).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodySurface.generate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `mesh`, `normals`, `coordinates`, `construction`, `rims`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodySurface.ts#IAutoMovieHumanBodySurface.GenerateDetails

## @evidence contracts/development/common.md#meaningful-documentation

Loft the whole calibrated body.

## @evidence contracts/development/design.md#principled-representation

Loft the whole calibrated body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodySurface.GenerateDetails is the canonical exchange used by AutoMovieHumanBodySurface.generate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodySurface.generate for loft the whole calibrated body.
