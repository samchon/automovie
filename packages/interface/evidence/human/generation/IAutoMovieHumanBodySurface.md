# src/human/generation/IAutoMovieHumanBodySurface.ts#IAutoMovieHumanBodySurface

## @evidence contracts/development/common.md#meaningful-documentation

Generated registered-frame skin buffers, material coordinates and opening rims in millimetres. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups IOutput, GenerateDetails and SolidObserver declarations. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IOutput, GenerateDetails separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanBodySurface exchanges the named IOutput, GenerateDetails and SolidObserver contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanBodySurface.ts#IAutoMovieHumanBodySurface.SolidObserver

## @evidence contracts/development/common.md#meaningful-documentation

Borrows the solid tessellator's named world-millimetre source charts from the same generation call.

## @evidence contracts/development/design.md#principled-representation

The observer sees the existing chart map as read-only. Those charts supplied the solid tessellator's point and derivative reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanBodySurface.generate calls an optional observer with the gathered source charts when requested.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The callback borrows the existing solid tessellator inputs from its generation call.

# src/human/generation/IAutoMovieHumanBodySurface.ts#IAutoMovieHumanBodySurface.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Generated skin in millimetres, registered frame.

## @evidence contracts/development/design.md#principled-representation `mesh`: Skin buffers, triangles counter-clockwise from outside. `normals`: Flat unit vertex normals of the whole skin. `coordinates`: Loft coordinates of every vertex, flat `[chain, station, phase, ...]`: the index of the chain in the calibration that evaluated it, the station (height or tilted-frame station, mm) and the phase (radians).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodySurface.generate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `mesh`, `normals`, `coordinates`, `construction`, `rims`. Optional `nailClipping` carries the actual emitted skin's per-digit maximum in mm when its producer observed clipping. An omitted receipt leaves that measurement unavailable.

# src/human/generation/IAutoMovieHumanBodySurface.ts#IAutoMovieHumanBodySurface.GenerateDetails

## @evidence contracts/development/common.md#meaningful-documentation

Loft the whole calibrated body.

## @evidence contracts/development/design.md#principled-representation

Loft the whole calibrated body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodySurface.GenerateDetails is the canonical exchange used by AutoMovieHumanBodySurface.generate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodySurface.generate for loft the whole calibrated body.
