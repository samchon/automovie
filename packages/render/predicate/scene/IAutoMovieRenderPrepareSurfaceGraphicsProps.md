# src/scene/IAutoMovieRenderPrepareSurfaceGraphicsProps.ts#IAutoMovieRenderPrepareSurfaceGraphicsProps

## @evidence contracts/development/common.md#meaningful-documentation

The fields describe the shot records, scene mapping, model registry and mounted lookup. The optional readers identify their assets and when omission causes refusal.

## @evidence contracts/development/design.md#principled-representation

The shot controls the key clock, the scene relates node id to model id and the mounted result identifies the actual displayed model and its parts. The renderer combines the authored frame and the selected native rigid carrier only after resolving those references.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The inputs reuse the shot, scene, model and built model contracts. I/O remains host supplied for image and font bytes.

# src/scene/IAutoMovieRenderPrepareSurfaceGraphicsProps.ts#IAutoMovieRenderPrepareSurfaceGraphicsProps.shot

## @evidence contracts/development/common.md#meaningful-documentation

The shot supplies the graphic tracks, the duration of their playback clock and the registry of their font sources.

# src/scene/IAutoMovieRenderPrepareSurfaceGraphicsProps.ts#IAutoMovieRenderPrepareSurfaceGraphicsProps.scene

## @evidence contracts/development/common.md#meaningful-documentation

The shot's scene supplies staged node identities and their model references.

# src/scene/IAutoMovieRenderPrepareSurfaceGraphicsProps.ts#IAutoMovieRenderPrepareSurfaceGraphicsProps.models

## @evidence contracts/development/common.md#meaningful-documentation

The models supply the authored surface sites, dimensions, articulation parts and image assets.

# src/scene/IAutoMovieRenderPrepareSurfaceGraphicsProps.ts#IAutoMovieRenderPrepareSurfaceGraphicsProps.resolveNode

## @evidence contracts/development/common.md#meaningful-documentation

The resolver returns the mounted root and optional named parts. Rigid graphics attach to the root. Articulated graphics attach to the matching native part.

## @evidence contracts/development/implementation.md#principled-implementation

Preparation resolves the staged node before mounting. A missing object refuses the named track. The returned object's part map chooses the native articulated carrier.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation calls the resolver once per track and retains the resulting graphic group for timeline reads.

# src/scene/IAutoMovieRenderPrepareSurfaceGraphicsProps.ts#IAutoMovieRenderPrepareSurfaceGraphicsProps.loadImage

## @evidence contracts/development/common.md#meaningful-documentation

The optional loader reads external project image assets and transfers ownership of each returned texture to the graphics. Such an image requires this loader.

# src/scene/IAutoMovieRenderPrepareSurfaceGraphicsProps.ts#IAutoMovieRenderPrepareSurfaceGraphicsProps.readFontAsset

## @evidence contracts/development/common.md#meaningful-documentation

The optional reader returns bytes for a font asset path. A shot using an asset font requires the reader during preparation.

## @evidence contracts/development/implementation.md#principled-implementation

Surface preparation passes the host reader to typography decoding. An asset source supplies its project-relative path and is decoded before the shot's graphic groups are built.

## @evidence contracts/development/implementation.md#efficient-algorithms

Font sources decode once for the preparation window. Frame playback uses the prepared glyph geometry.
