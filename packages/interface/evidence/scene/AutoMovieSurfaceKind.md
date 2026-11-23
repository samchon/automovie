# src/scene/AutoMovieSurfaceKind.ts#AutoMovieSurfaceKind

## @evidence contracts/development/design.md#principled-representation

Closed floor, platform and ramp labels describe supported set-surface roles while polygon and height law independently define their actual geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Semantic kind stays separate from terrain shape and walkability so one label cannot silently infer dimensions or physical traversal rules.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A ramp label does not synthesize stairs or a slope; the authored height rule supplies geometry and supported validators decide traversal.

## @evidence contracts/development/common.md#meaningful-documentation

Defines floor, raised platform and sloped-connector meaning and their separation from geometry.
