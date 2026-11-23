# src/analysis/IAutoMovieAcousticSource.ts#IAutoMovieAcousticSource

## @evidence contracts/development/design.md#principled-representation

A steady point source with a directivity factor, combined with the diffuse field through the room constant, the classical direct-plus-reverberant energy sum that holds for a diffuse room and a receiver outside the near field.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Position, broadband sound power and directivity are the only inputs the energy law reads, so the source carries no spectrum or orientation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A silent or overflowing source set is reported as a gap rather than an infinite decibel value, and directivity must be positive rather than clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States the energy contribution formula, the underflow and overflow gap conditions, the metre unit, the dB re 1 pW reference, and the meaning of a directivity of one.
