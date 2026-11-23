# src/render/caption/IAutoMovieCaptionGraphemeRuntime.ts#IAutoMovieCaptionGraphemeRuntime

## @evidence contracts/development/design.md#principled-representation

Host-supplied deterministic grapheme iterator paired with the exact identity of that behavior. inspectAutoMovieCaptionReadabilityWithRuntime compares identity before issuing a verdict and counts yielded values without reading them. The host must keep identity and segmentation behavior consistent; iterator failures propagate. No SDK result object is required because yielded payloads have no semantic role.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The named operation and its callers share this exact record instead of deriving a type from implementation code.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The documented boundary preserves its producer's admitted values and does not introduce a fallback representation.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the concrete producer, interpretation and failure or comparison semantics.
