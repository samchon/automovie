# src/render/delivery/IAutoMovieProductionAacProfile.ts#IAutoMovieProductionAacProfile

## @evidence contracts/development/design.md#principled-representation

Literal types pin the one profile the delivery encoder writes: sample entry `mp4a`, audio object type 2 (AAC-LC), 48,000 Hz and two channels, each a fact the MP4 sample entry stores, so no other value type-checks as the profile.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The constant `AUTOMOVIE_PRODUCTION_AAC_PROFILE` supplies it and `assertProductionAacProfile` reads it. The 192 kb/s bit rate is an encoder setting the file does not store as a checkable fact, so it is left out.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no consumer's fixture and admits no wider configuration; a different rate or layout is a different profile, not an option of this one.

## @evidence contracts/development/common.md#meaningful-documentation

States each required fact with its unit, the constant and asserter that use it, and why the bit rate is absent.
