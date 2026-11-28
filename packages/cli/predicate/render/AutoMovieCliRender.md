# src/render/AutoMovieCliRender.ts#AutoMovieCliRender.renderVideo

## @evidence contracts/development/common.md#meaningful-documentation

The public description identifies the approved output, the reportable failure evidence, transparent-layer behavior and temporary file cleanup.

## @evidence contracts/development/implementation.md#principled-implementation

The implementation records native frame receipts after the Render writer returns and publishes a partial scene audit against the original expected frame count. Mount failures use a known output directory when available. A failed candidate updates the report while leaving the prior approved film installed.

## @evidence contracts/development/implementation.md#efficient-algorithms

The attempt updates one latest requested and acknowledged pair and appends one receipt per written native frame. No stage receipt requests an extra frame. A complete checkpoint bypasses the draw host and supplies its verified raster inputs. Delivery audit reads the encoded candidate and the corresponding raster sequence before the attempt releases staging.

# src/render/AutoMovieCliRender.ts#AutoMovieCliRender.IRenderVideoInput

## @evidence contracts/development/common.md#meaningful-documentation

The input explains subject selection, guide passes, output path and mode, and progress observations.

## @evidence contracts/development/design.md#principled-representation

The named input carries one subject selection and explicit draw host, output folder and an encoder. The background choice distinguishes scene rendering from a separate transparent layer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same input drives the CLI host and injected render fixtures. The optional observer consumes host receipts. The optional checkpoint owns storage and reuse of verified native draw data.

# src/render/AutoMovieCliRender.ts#AutoMovieCliRender.ICheckpoint

## @evidence contracts/development/common.md#meaningful-documentation

The checkpoint contract identifies the storage directory, exact production input digest and renderer identity.

## @evidence contracts/development/design.md#principled-representation

The programmatic input requires all three fields. The checkpoint owner admits the SHA-256 form before opening the draw host, records the subject and actual backend, and binds saved frame data to those facts and the render request.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller provides the production-specific source identity. The CLI derives its installed renderer identity from the installed Render entry and its selected browser configuration. The checkpoint owner chooses the format version, lock and per-frame receipt.
