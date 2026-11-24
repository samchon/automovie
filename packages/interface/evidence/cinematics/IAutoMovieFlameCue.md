# src/cinematics/IAutoMovieFlameCue.ts#IAutoMovieFlameCue

## @evidence contracts/development/common.md#meaningful-documentation

States the flame frame, the closed-form determinism, how a bound light and an emission each set luminance and colour, every admission refusal, and each field's unit and range.

## @evidence contracts/development/design.md#principled-representation

Size is a closed union keyed by `kind`, so a small flame carries height and radius, an open fire heat release and diameter, and an ember a radius; luminance lives either on the bound light or in `emission`, which admission makes exclusive.

## @evidence contracts/development/design.md#minimal-and-owned-surface

performShot admits and copies it, compilePerformShotPracticalLights reads the binding it names, the mask derivation reads it through the render subject, and render draws it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No free-form shape or colour key track: shape and flicker are computed from the cue and shot time, and the bound light stays authoritative.
