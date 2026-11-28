# src/render/IAutoMovieRunVideoCaptureProps.ts#IAutoMovieRunVideoCaptureProps

## @evidence contracts/development/common.md#meaningful-documentation

Describes file capture, stream selection and the optional exact presentation adapter.

## @evidence contracts/development/design.md#principled-representation

Existing process runners can supply images without exact timing. One optional extraction callback supplies exact stream PTS from the picture command; it receives selected native indices in output order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Render owner determines native selection and file order. The host runs FFmpeg, binds decoder output to source bytes and returns typed presentation evidence.

# src/render/IAutoMovieRunVideoCaptureProps.ts#IAutoMovieRunVideoCaptureProps.streamIndex

## @evidence contracts/development/common.md#meaningful-documentation

Names the authoritative absolute stream chosen by the probe.

# src/render/IAutoMovieRunVideoCaptureProps.ts#IAutoMovieRunVideoCaptureProps.extract

## @evidence contracts/development/common.md#meaningful-documentation

Lets the host verify PTS from the selected decoder invocation while maintaining the legacy runner route.
