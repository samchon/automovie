# src/render/IAutoMoviePoseKeypointSidecar.ts#IAutoMoviePoseKeypointSidecar

## @evidence contracts/development/design.md#principled-representation

The sidecar is addressed in output frames on the render's own clock, `round(runtime * fps)` frames at `i / fps`, the same schedule the render captures, so frame `i` of the sidecar describes frame `i` of the video.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record holds the target, the clock, the frame count and the frame list, nothing a consumer could not use, and the planner and serializer are separate so a host can inspect or slice before writing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every output frame has a record even when nothing resolves on it, and no host-specific field is added.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states what the sidecar accompanies, who reads it and for what, who builds and serializes it, and each member states its unit and invariant.
