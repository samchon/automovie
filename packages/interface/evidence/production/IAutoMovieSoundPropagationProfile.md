# src/production/IAutoMovieSoundPropagationProfile.ts#IAutoMovieSoundPropagationProfile

## @evidence contracts/development/design.md#principled-representation

Propagation divides effective source/listener distance by declared positive speed, rounds delay once to film frames, applies the softened inverse-square gain and optional decibel-per-meter high-frequency amplitude loss, then honors the selected cut-boundary policy.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One production-owned profile groups speed, distance and spectral laws, segment-boundary choice and explicit assumptions while event receipts carry the calculated arrival and gains.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Spectral none returns null rather than claiming zero measured absorption, and arrivals outside the finished film refuse; no atmospheric speed or cut policy is inferred when a profile is absent.

## @evidence contracts/development/common.md#meaningful-documentation

Defines speed units, exact gain law, non-negative coefficient, optional spectral model units, cut carry/trim behavior and authored physical assumptions.
