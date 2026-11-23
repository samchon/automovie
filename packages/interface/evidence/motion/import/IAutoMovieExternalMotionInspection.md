# src/motion/import/IAutoMovieExternalMotionInspection.ts#IAutoMovieExternalMotionInspection

## @evidence contracts/development/design.md#principled-representation

Takes are rewritten from FLOAT accessors to node tracks with exact copied keyframes under one declared spatial interpretation, so motion data is reproducible from the bytes alone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

nodeIds exposes source-order stable identities for mapping authors and inspection tests, while adoption consumes nodes with their transforms.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal constrains typed producers to one declared convention; the inspector emits it and adoption checks it at runtime, while this erased interface alone cannot authenticate externally supplied transforms or their units.

## @evidence contracts/development/common.md#meaningful-documentation

The comments state that the path and length repeat for adoption checks, the length excludes sidecars, and how takes are ordered, named, timed and flagged as non-looping.
