# src/render/IAutoMovieCaptureCellRecord.ts#IAutoMovieCaptureCellRecord.IDrawn

## @evidence contracts/development/common.md#meaningful-documentation

The drawn branch carries still file identity, render backend, repeatable view data, pattern resolutions and any retained motion trail evidence.

## @evidence contracts/development/design.md#principled-representation

The drawn outcome owns the file and the evidence captured alongside it. The failure branch carries its cause and shares only the address and sheet placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same trail segment contract crosses the draw and retention boundary without an additional geometry type or request option.

# src/render/IAutoMovieCaptureCellRecord.ts#IAutoMovieCaptureCellRecord.IDrawn.motionTrails

## @evidence contracts/development/common.md#meaningful-documentation

The field belongs to a still that drew selected source-backed trail samples. Older rows and draws without that source evidence omit it.

# src/render/IAutoMovieCaptureCellRecord.ts#IAutoMovieCaptureCellRecord.IDrawn.state

## @evidence contracts/development/common.md#meaningful-documentation

The drawn tag identifies the branch whose still was rendered and written.

# src/render/IAutoMovieCaptureCellRecord.ts#IAutoMovieCaptureCellRecord.IDrawn.file

## @evidence contracts/development/common.md#meaningful-documentation

Records the still's file name in the same capture folder as the cell record.

# src/render/IAutoMovieCaptureCellRecord.ts#IAutoMovieCaptureCellRecord.IDrawn.hash

## @evidence contracts/development/common.md#meaningful-documentation

Names the image digest produced from the still's drawn pixels by AutoMovieRenderPicture.hashRasterImage.

# src/render/IAutoMovieCaptureCellRecord.ts#IAutoMovieCaptureCellRecord.IDrawn.fileSha256

## @evidence contracts/development/common.md#meaningful-documentation

Names SHA-256 over the encoded file bytes and allows earlier hosts to omit it.

# src/render/IAutoMovieCaptureCellRecord.ts#IAutoMovieCaptureCellRecord.IDrawn.backend

## @evidence contracts/development/common.md#meaningful-documentation

Keeps the renderer identity the host supplied. Null records its absence.

# src/render/IAutoMovieCaptureCellRecord.ts#IAutoMovieCaptureCellRecord.IDrawn.camera

## @evidence contracts/development/common.md#meaningful-documentation

A draw page stores its resolved camera as JSON. A host that omits a camera leaves null.

# src/render/IAutoMovieCaptureCellRecord.ts#IAutoMovieCaptureCellRecord.IDrawn.repeat

## @evidence contracts/development/common.md#meaningful-documentation

Retains fixed-view text a later capture can reuse, including orthographic scale and up direction when needed. Null records its absence.

# src/render/IAutoMovieCaptureCellRecord.ts#IAutoMovieCaptureCellRecord.IDrawn.resolved

## @evidence contracts/development/common.md#meaningful-documentation

Records the topmost matches and counts for request and view patterns when reported by the draw host.
