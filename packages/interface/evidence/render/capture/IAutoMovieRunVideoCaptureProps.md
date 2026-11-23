# src/render/capture/IAutoMovieRunVideoCaptureProps.ts#IAutoMovieRunVideoCaptureProps

## @evidence contracts/development/design.md#principled-representation

The host must reject run when FFmpeg fails and owns process cleanup.

## @evidence contracts/development/design.md#minimal-and-owned-surface

runAutoMovieVideoCapture exchanges file, subject, request, storage, root, run, revision; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The host must reject run when FFmpeg fails and owns process cleanup.

## @evidence contracts/development/common.md#meaningful-documentation

A probed video's clock/raster, capture request and host storage/process operations. runAutoMovieVideoCapture refuses unsupported views/passes/inspection and off-grid instants before extraction, detects cuts then extracts selected frames, and records missing frames as failed cells. The prose and members document how runAutoMovieVideoCapture interprets and admits these values.
