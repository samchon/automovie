# src/production/effect/IAutoMovieFilmEffectCurrentIdentity.ts#IAutoMovieFilmEffectCurrentIdentity

## @evidence contracts/development/design.md#principled-representation

Currentness is decided by exact string equality of four independently established identities, two ids and two SHA-256 content digests, so a runtime is current only when it was written for this production, film, compile input and normalized edit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record carries the whole identity the writer stamps and the sampler compares, so neither function takes four loose arguments and both validate it through `validateProductionFilmEffectIdentity`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field is optional or wildcarded, and the digests are refused rather than normalized when they are uppercase or use another algorithm, so a malformed identity never reads as a stale match.

## @evidence contracts/development/common.md#meaningful-documentation

States that the consumer derives the values outside the runtime, which functions stamp and compare them, the non-blank and digest-format rules, and for each member where its value comes from.
