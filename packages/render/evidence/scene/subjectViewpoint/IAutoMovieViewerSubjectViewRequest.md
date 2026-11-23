# src/index.ts#IAutoMovieViewerSubjectViewRequest

## @evidence contracts/development/design.md#principled-representation

Collects the exact pose, native scene/camera, snapshot port and mandatory pre-draw population callback; labels do not resolve the subject or verify renderer/source readiness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Camera application, population realization and snapshot encoding retain their existing owners and occur in that order.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A mandatory callback cannot prove that its implementation resolves every population; there is no browser recovery, runtime source validation or hidden no-op replacement.

## @evidence contracts/development/common.md#meaningful-documentation

Documents borrowed resources, camera mutation, pre-draw callback and optional encoding/plan metadata.

# src/index.ts#IAutoMovieViewerSubjectViewRequest.resolveForCamera

## @evidence contracts/development/implementation.md#principled-implementation

The capture owner calls this synchronous effect after camera projection/world updates and before rendering, so each supported population can select its current visible chunks from the actual view.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Scene population realization remains with the caller that knows its producers; capture owns ordering rather than another scene registry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A required typed function does not prove its body resolves populations, and no no-op fallback or fixture population replacement is supplied by capture.

## @evidence contracts/development/common.md#meaningful-documentation

States matrix/height inputs, synchronous ordering and the callback implementer's completeness responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

Actual cost depends on the caller's population and chunk selection; this signature promises no fixed traversal cost or native performance bound.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The callback must use current camera, geometry/population and viewport state; equal labels alone cannot share prior mutation or realization effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows camera and caller-owned populations for the call; any retained chunk buffers and release protocol belong to their real producer, and a thrown callback leaves already applied camera state.
