# src/render/IAutoMovieCaptionSidecar.ts#IAutoMovieCaptionSidecar

## @evidence contracts/development/design.md#principled-representation

Spans are addressed in output frames at the render's `fps`, the same integer clock the captured frame files use, so a consumer maps a span to files by index without time arithmetic.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four fields carry only what a consumer needs to place spans against frame files; the cut, shots and script stay with the planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The `frameCount` is stated explicitly so a slice can refuse a window beyond coverage instead of inferring coverage from the last span.

## @evidence contracts/development/common.md#meaningful-documentation

The prose names the producer, slicer and serializer; members state the frame clock, how `frameCount` is computed, and the tiling guarantee of `entries`.
