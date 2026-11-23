# src/physics/IAutoMoviePhysicalRecoveryPolicy.ts#IAutoMoviePhysicalRecoveryPolicy

## @evidence contracts/development/common.md#meaningful-documentation

Specifies recovery-step geometry, timing, force limits, landing gates and optional bracing defaults.

## @evidence contracts/development/design.md#principled-representation

Metre reach/clearance, second durations and SI gains describe a controller policy; numeric bounds and pattern references require simulation admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

advancePhysicalBalance shares the authored footfall pattern while simulation admission supplies optional controller defaults.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bracing carries provider-declared height and shift limits; requested steps do not constitute measured landings.
