# src/index.ts#createAutoMovieMetricOrthographicCamera

## @evidence contracts/development/implementation.md#principled-implementation

Native frustum bounds are calibrated pixel-edge limits in metres; right is (cos(a),0,sin(a)), up is +Y and position lies on their cross product. Native rotation about Y and updateProjectionMatrix preserve the supplied affine projection without a custom override or distance-dependent lookAt normalization.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This generic viewer owner maps one explicit metric chart to native Three camera fields while inverse geometry fitting and image acquisition remain independent.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No approximate perspective lens, guessed focal length, altered principal point, image resampling, source-dependent pose or native method replacement is used.

## @evidence contracts/development/common.md#meaningful-documentation

Gives pixel centres/edges, world/image signs, metre pitch, principal point, horizontal restriction and the separate role of orthographic depth limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of trigonometric, scalar and native matrix operations constructs one camera independent of image pixel population.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each explicit chart gets its own mutable caller-owned native camera rather than a shared stale projection.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One CPU camera is returned without a renderer, GPU allocation, image buffer, listener, handle or global cache.
