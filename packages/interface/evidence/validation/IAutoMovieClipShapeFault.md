# src/validation/IAutoMovieClipShapeFault.ts#IAutoMovieClipShapeFault

## @evidence contracts/development/design.md#principled-representation

Relative field, violation kind, message and offending value describe duration, loop or track faults; sampleClip throws its first fault while artifact validation locates and appends the applicable failures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Fault data separates the shared arithmetic/shape rule from the two consumers' failure presentation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Dense shape faults carry a length or stride instead of echoing every sample, while value faults can retain an offending value; the type does not invent a successful playable track.

## @evidence contracts/development/common.md#meaningful-documentation

Documents relative path joining, message use and diagnostic payload ownership without claiming every fault stores only a scalar.
