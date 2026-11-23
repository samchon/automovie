# src/render/IAutoMoviePlanChunkedSequenceRenderProps.ts#IAutoMoviePlanChunkedSequenceRenderProps

## @evidence contracts/development/design.md#principled-representation

Frame intervals are half-open; output timestamps remain global while file indices restart within each chunk.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planChunkedSequenceRender exchanges plan, spec, chunkFrames, passes; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing passes omits pass manifests.

## @evidence contracts/development/common.md#meaningful-documentation

Whole-sequence manifest and independent chunk encoding controls. planChunkedSequenceRender validates a positive integer chunkFrames; matching target and output frame format are caller premises, not independently revalidated. The prose and members document how planChunkedSequenceRender interprets and admits these values.
