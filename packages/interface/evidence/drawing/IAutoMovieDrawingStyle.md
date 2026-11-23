# src/drawing/IAutoMovieDrawingStyle.ts#IAutoMovieDrawingStyle

## @evidence contracts/development/design.md#principled-representation

The serializer checks finite positive role weights, dash entries and text height, then formats them to three decimals in page millimetres. Admission precedes formatting, so a small positive value can print as zero and extreme finite values can overflow the intermediate round(value*1000)/1000; no printed-value admission follows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Styling lives on the view and is applied only at serialization, so drawing metadata and its digest stay independent of the pen. The serializer matches view id, not the complete original view; weight and dash maps supply every role but do not form runtime closed-object admission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An invalid value throws before any SVG is written instead of being clamped or replaced with a default, and no role, layer or discipline gets a built-in pen.

## @evidence contracts/development/common.md#meaningful-documentation

States the page-millimetre unit and its reason, that derivation ignores the style, the serializer's refusal, and which pen strokes openings and dimensions; members restate the positivity rule, the solid meaning of an empty dash array, and that the text height sizes annotations only.
