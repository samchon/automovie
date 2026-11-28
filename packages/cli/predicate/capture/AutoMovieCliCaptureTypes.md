# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.VideoProbe

## @evidence contracts/development/common.md#meaningful-documentation

Names the absolute input stream and source size beside its sampling clock.

## @evidence contracts/development/design.md#principled-representation

The first video has the same ordinal as the probe command, even when audio comes first. The nominal rate can support legacy sampling; exact selected PTS is a separate extraction observation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The probe owns first-stream discovery, raster and sampling rate. Actual source ticks come from the selected decoder invocation.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IReadRetainedFramesProps

## @evidence contracts/development/common.md#meaningful-documentation

Pins a complete source record and requests a bounded output frame interval.

## @evidence contracts/development/design.md#principled-representation

The record SHA-256 is checked before parsing. The requested half-open native range uses nonnegative safe integers and caps its considered rows. An explicit source model identifies either a camera projection or an encoded stream.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The option carries the installed production root, view, pass and source identity needed to select existing PNGs. It asks for no fresh scene or decoder settings.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.RetainedSource

## @evidence contracts/development/common.md#meaningful-documentation

Names the independent identity for rendered and decoded PNGs.

## @evidence contracts/development/design.md#principled-representation

A rendered frame requires a projection key. A decoded frame requires the source digest and absolute stream with exact PTS. The mode chooses the admissible evidence path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The reader uses the same capture record layout while each mode contributes only the identity it actually needs.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IDrawnSource

## @evidence contracts/development/common.md#meaningful-documentation

Requires the exact expected projection from the desired drawn view.

## @evidence contracts/development/design.md#principled-representation

The canonical key includes raster, layer mask and matrices. Preview text alone cannot qualify an exact match.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Render camera owner supplies the key; the CLI consumes it to qualify previously drawn pictures.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IVideoSource

## @evidence contracts/development/common.md#meaningful-documentation

Binds the expected decoded source bytes and stream.

## @evidence contracts/development/design.md#principled-representation

The digest identifies the encoded file and the absolute stream discriminates competing tracks within the same file.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The lookup reuses decoder evidence already written in the record. It does not need to run the decoder or open the original video.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.RetainedFrame

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes a verified PNG from an unavailable requested frame.

## @evidence contracts/development/design.md#principled-representation

Both states keep the requested native index. The verified variant includes bytes and their hash; the unavailable variant carries the cause.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The reader returns only selected pictures and admitted timestamps while preserving missing or rejected addresses as explicit rows.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IRetainedPicture

## @evidence contracts/development/common.md#meaningful-documentation

Describes the original verified PNG and any exact decoder timestamp.

## @evidence contracts/development/design.md#principled-representation

The returned payload is the same bytes hashed against the record. A video observation includes signed ticks and a rational time base; drawn captures carry no decoder timestamp.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The retained still path helps a caller reopen a picture, while the returned bytes already bind it to its digest without resampling.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IUnavailableFrame

## @evidence contracts/development/common.md#meaningful-documentation

Describes a requested frame whose picture could not be verified.

## @evidence contracts/development/design.md#principled-representation

The unavailable variant keeps the expected frame and reason without a stale pointer or estimated time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A bounded range can contain both evidence and holes, so the reader owns one refusal per missing, ambiguous or mismatched picture.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IRetainedFrames

## @evidence contracts/development/common.md#meaningful-documentation

Describes requested size, truncation and the ordered results.

## @evidence contracts/development/design.md#principled-representation

Requested counts the full range before limiting. Each of the considered native indices appears once, with the result for its available evidence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A caller can select a subsequent range when truncated; the first call returns at most its bounded number of retained images.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IReadRetainedFramesProps.root

## @evidence contracts/development/common.md#meaningful-documentation

Names the production base for file resolution and its installed Render dependency.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IReadRetainedFramesProps.record

## @evidence contracts/development/common.md#meaningful-documentation

Names the local complete record path whose resolved bytes will be checked.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IReadRetainedFramesProps.recordSha256

## @evidence contracts/development/common.md#meaningful-documentation

Names the expected receipt SHA-256 and its lowercase hexadecimal encoding.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IReadRetainedFramesProps.subject

## @evidence contracts/development/common.md#meaningful-documentation

Carries the recorded subject identity the caller wants to inspect.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IReadRetainedFramesProps.view

## @evidence contracts/development/common.md#meaningful-documentation

Requires the selected capture view, including file for a decoded capture.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IReadRetainedFramesProps.pass

## @evidence contracts/development/common.md#meaningful-documentation

Requires the pass whose actual picture is selected.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IReadRetainedFramesProps.fromFrame

## @evidence contracts/development/common.md#meaningful-documentation

Names the first inclusive native index of the requested range.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IReadRetainedFramesProps.endFrame

## @evidence contracts/development/common.md#meaningful-documentation

Names the exclusive upper native index.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IReadRetainedFramesProps.limit

## @evidence contracts/development/common.md#meaningful-documentation

Names the default row count and explicit supported limit.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IReadRetainedFramesProps.source

## @evidence contracts/development/common.md#meaningful-documentation

Names the exact drawn camera or encoded stream identity.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IRetainedPicture.type

## @evidence contracts/development/common.md#meaningful-documentation

The retained discriminant guarantees this row has an admitted picture.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IRetainedPicture.frame

## @evidence contracts/development/common.md#meaningful-documentation

Carries the requested native ordinal.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IRetainedPicture.file

## @evidence contracts/development/common.md#meaningful-documentation

Names the original retained PNG path.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IRetainedPicture.fileSha256

## @evidence contracts/development/common.md#meaningful-documentation

Names the digest already verified against the returned bytes.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IRetainedPicture.bytes

## @evidence contracts/development/common.md#meaningful-documentation

Carries the original PNG payload from a capture, including retained stamps.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IRetainedPicture.presentation

## @evidence contracts/development/common.md#meaningful-documentation

Shares decoder ticks and time base for an encoded frame.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IUnavailableFrame.type

## @evidence contracts/development/common.md#meaningful-documentation

The unavailable discriminant prevents the row from bearing picture bytes.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IUnavailableFrame.frame

## @evidence contracts/development/common.md#meaningful-documentation

Keeps the requested native index in the returned ordering.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IUnavailableFrame.reason

## @evidence contracts/development/common.md#meaningful-documentation

Explains why the frame supplies no admitted evidence.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IRetainedFrames.requested

## @evidence contracts/development/common.md#meaningful-documentation

Counts all native indices requested before applying the response limit.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IRetainedFrames.truncated

## @evidence contracts/development/common.md#meaningful-documentation

Indicates the range was shortened by the response limit.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IRetainedFrames.frames

## @evidence contracts/development/common.md#meaningful-documentation

Keeps each considered index in native order, including unavailable rows.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IVideoSource.type

## @evidence contracts/development/common.md#meaningful-documentation

Chooses the stored native decode evidence path.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IVideoSource.fileSha256

## @evidence contracts/development/common.md#meaningful-documentation

Requires the digest of the expected encoded bytes.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IVideoSource.streamIndex

## @evidence contracts/development/common.md#meaningful-documentation

Requires the absolute decoded stream within those input bytes.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IDrawnSource.type

## @evidence contracts/development/common.md#meaningful-documentation

Chooses the exact Render camera evidence path.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.IDrawnSource.projectionKey

## @evidence contracts/development/common.md#meaningful-documentation

Holds the desired projection key from the camera owner.

# src/capture/AutoMovieCliCaptureTypes.ts#AutoMovieCliCaptureTypes.VideoProbe.streamIndex

## @evidence contracts/development/common.md#meaningful-documentation

Preserves the absolute input index behind the first-video ordinal used by the probe.
