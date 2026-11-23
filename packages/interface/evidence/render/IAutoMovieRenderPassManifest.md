# src/render/IAutoMovieRenderPassManifest.ts#IAutoMovieRenderPassManifest

## @evidence contracts/development/design.md#principled-representation

Two arrays parallel to the chunk list describe the walk, because the chunk directories already order the frames and the pass tag only changes the file pattern inside each directory.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The manifest carries only directories, patterns and the total, and leaves frame-level paths to each chunk's `passOutputs`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The beauty pass gets a manifest like every other pass, and no pass name is treated specially here; the beauty pass additionally reassembles as video through the concat plan.

## @evidence contracts/development/common.md#meaningful-documentation

The prose states that this is how a tagged pass is reassembled and why patterns are included; members state order, parallelism and the frame total.
