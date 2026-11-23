# src/geometry/IAutoMovieSurfaceFrame.ts#IAutoMovieSurfaceFrame

## @evidence contracts/development/design.md#principled-representation

An origin and two independent directions determine an oriented rigid frame without introducing scale or changing sample distances.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same structural record describes the prepared source frame and requested destination, while the computation owner admits directions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No actor, support policy or inferred world axis is part of the frame; its directions must be supplied explicitly.

## @evidence contracts/development/common.md#meaningful-documentation

States metre units, centroid origin, normal priority, projected forward, magnitude independence and degenerate refusal.
