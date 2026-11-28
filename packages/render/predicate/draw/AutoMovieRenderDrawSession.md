# src/draw/AutoMovieRenderDrawSession.ts#AutoMovieRenderDrawSession.open

## @evidence contracts/development/common.md#meaningful-documentation

The public method explains how the draw host mounts, receives the subject description and leaves page cleanup with the caller on rejection.

## @evidence contracts/development/implementation.md#principled-implementation

Page navigation, draw-function readiness and subject description each use the admitted per-call deadline. Their acknowledgments follow successful completion. A timer that wins an RPC records no acknowledgment from its eventual late response.

## @evidence contracts/development/implementation.md#efficient-algorithms

Mount requests each stage once and uses one timeout per bounded host operation. The returned session owns its page for future draws and releases it through close.

# src/draw/AutoMovieRenderDrawSession.ts#AutoMovieRenderDrawSession.prototype.draw

## @evidence contracts/development/common.md#meaningful-documentation

The contract names the exact requested raster and the behavior of missing browser acknowledgment and rejected pixel bytes.

## @evidence contracts/development/implementation.md#principled-implementation

An acknowledgment follows both the browser response and raster decoding. A timed-out request never acknowledges a late response, and the stage receipt does not infer browser-internal causation.

## @evidence contracts/development/implementation.md#efficient-algorithms

The draw operation calls the browser once, decodes one base64 raster and releases its operation timer on settlement.

# src/draw/AutoMovieRenderDrawSession.ts#AutoMovieRenderDrawSession.prototype.drawing

## @evidence contracts/development/common.md#meaningful-documentation

The cell draw returns raster and label data, view and selection receipts, and source-backed trail samples at the exact played clocks when supplied.

## @evidence contracts/development/implementation.md#principled-implementation

Plan and draw the addressed cell once. Copy the optional trail output of that settled draw into the cell drawing without changing its clocks, positions or source facts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draw and label the existing raster once. Forward the already bounded trail samples without additional placement or provider queries.
