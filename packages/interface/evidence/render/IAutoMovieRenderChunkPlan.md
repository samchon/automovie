# src/render/IAutoMovieRenderChunkPlan.ts#IAutoMovieRenderChunkPlan

## @evidence contracts/development/design.md#principled-representation

The plan keeps the whole render's identity, rate and frame total beside the chunks, so a host can check that the chunks cover the render before reassembling it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Chunks, the video reassembly and the optional pass manifests are separate fields because the beauty video and tagged frame sequences finish differently.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absent `passManifests` means no passes were requested, and the plan carries no host-specific field.

## @evidence contracts/development/common.md#meaningful-documentation

The prose states what the plan holds; members state what is copied from the whole plan, the shorter last chunk, and when pass manifests are present and how beauty and tagged passes finish.
