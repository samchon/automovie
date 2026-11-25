# src/production/IAutoMoviePointSubjectBox.ts#IAutoMoviePointSubjectBox.IExtent

## @evidence contracts/development/design.md#principled-representation

min/max are Y offsets in metres relative to the supplied world point; the consumer adds them to point.y while X and Z remain equal on both corners.

## @evidence contracts/development/design.md#minimal-and-owned-surface

pointSubjectBox consumes this pair for unmeasured stand-ins and measured zero-width segments routed by nodeSubjectBox.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Finite ordered offsets are a caller premise; no validation, clamping or invented width occurs, and an inverted pair remains inverted.

## @evidence contracts/development/common.md#meaningful-documentation

Vertical offsets used to turn a world point into a degenerate subject box. min/max are Y offsets in metres relative to the supplied world point; the consumer adds them to point.y while X and Z remain equal on both corners.
