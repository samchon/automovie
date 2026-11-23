# src/motion/AutoMovieEasing.ts#AutoMovieEasing

## @evidence contracts/development/design.md#principled-representation

The named curves map normalized segment progress into interpolation weight, with quadratic ease-in and ease-out, piecewise ease-in-out and a held step; cubicBezier uses explicit controls and inversion of its monotone time coordinate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed curve name stays on the outgoing keyframe, with explicit cubic controls on that keyframe rather than a second interpolation configuration hierarchy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Curves depend on normalized time rather than frame number or actor identity; validateMotion checks a keyframe's cubic x controls before sampling, while direct cubic and gait callers must supply that same monotone-time domain themselves.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the outgoing segment, sparse sampling model and each named curve's start and stop behavior, with explicit control ownership for cubicBezier.
