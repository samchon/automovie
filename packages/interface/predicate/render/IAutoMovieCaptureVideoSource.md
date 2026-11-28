# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource

## @evidence contracts/development/common.md#meaningful-documentation

Documents detected cuts, source path, and optional exact selected-stream frame evidence.

## @evidence contracts/development/design.md#principled-representation

The video source can retain estimated legacy still addresses without exact PTS. Native exactness needs a stream and a signed rational timestamp for each requested extraction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A file record owns the selected stream and its cuts; separate presentation evidence keeps legacy capture readers and estimated addresses usable.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.Presentation

## @evidence contracts/development/common.md#meaningful-documentation

Names the exact and unavailable clock states.

## @evidence contracts/development/design.md#principled-representation

A complete selected decode supplies stream and frame timestamps together. An unavailable observation carries the refusal reason instead of substituting an estimated timestamp.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The exact state carries every extracted frame timestamp. The unavailable state carries one reason, and a legacy record may omit the field.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.IDecoded

## @evidence contracts/development/common.md#meaningful-documentation

Binds source SHA-256 and FFmpeg stream index to the selected decoder clock.

## @evidence contracts/development/design.md#principled-representation

The immutable stream-and-byte identity belongs to the selected frame receipts. Time base stays rational and indices stay separate from integer PTS ticks, including signed or duplicate actual timestamps.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The decoder callback ties one input digest and stream to the bounded set of emitted PNG indices. It exposes per-frame ticks without retaining the decoder log.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.IUnavailable

## @evidence contracts/development/common.md#meaningful-documentation

States why the decoder has no complete exact clock.

## @evidence contracts/development/design.md#principled-representation

The discriminant separates absent exact observations from measured zero or other valid ticks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The reason helps the caller distinguish a failed exact timing extraction from an unavailable legacy clock.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the decoded ordinal from its presentation ticks.

## @evidence contracts/development/design.md#principled-representation

An ordinal owns one extracted still; the signed tick on the parent's declared time base preserves the file clock without a binary64 seconds conversion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each receipt needs only the decoder's stream-local frame ordinal and original presentation ticks. The parent owns the shared time base and source digest.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.presentation

## @evidence contracts/development/common.md#meaningful-documentation

Stores the selected native clock or its unavailable reason, separately from legacy capture time.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.IDecoded.type

## @evidence contracts/development/common.md#meaningful-documentation

The decoded discriminant selects the presence of a complete observed native clock.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.IDecoded.fileSha256

## @evidence contracts/development/common.md#meaningful-documentation

Records the lowercase SHA-256 of the encoded source checked through extraction.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.IDecoded.streamIndex

## @evidence contracts/development/common.md#meaningful-documentation

Preserves the exact absolute FFmpeg input stream across probe, cut detection and still extraction.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.IDecoded.timeBase

## @evidence contracts/development/common.md#meaningful-documentation

Preserves the decoder's integer seconds-per-tick ratio.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.IDecoded.frames

## @evidence contracts/development/common.md#meaningful-documentation

Retains the selected decoded ordinals and their native ticks from the same PNG extraction.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.IUnavailable.type

## @evidence contracts/development/common.md#meaningful-documentation

The unavailable discriminant refuses a complete exact clock while leaving legacy sampling readable.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.IUnavailable.reason

## @evidence contracts/development/common.md#meaningful-documentation

Names the exact timing or map condition the native output did not establish.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.IFrame.frame

## @evidence contracts/development/common.md#meaningful-documentation

Names the zero-based source stream ordinal selected by the extraction.

# src/render/IAutoMovieCaptureVideoSource.ts#IAutoMovieCaptureVideoSource.IFrame.ticks

## @evidence contracts/development/common.md#meaningful-documentation

Preserves signed ticks in the file's admitted rational time base.
