# src/render/delivery/IAutoMovieDecodedFrame.ts#IAutoMovieDecodedFrame

## @evidence contracts/development/design.md#principled-representation

Adjacent identical image digests are allowed holds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

auditAutoMovieDecodedFrames.IFrame exchanges stream, pts, duration, md5; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Adjacent identical image digests are allowed holds.

## @evidence contracts/development/common.md#meaningful-documentation

One admitted stream-zero framemd5 row. auditAutoMovieDecodedFrames checks nonnegative safe-integer presentation ticks, positive duration, positive raster byte count and equal decode/presentation timestamps. The prose and members document how auditAutoMovieDecodedFrames.IFrame interprets and admits these values.
