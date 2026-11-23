# src/production/capture/IAutoMovieRepaintParameters.ts#IAutoMovieRepaintParameters

## @evidence contracts/development/design.md#principled-representation

Explicit prompt, seed and strength fields describe generation controls, with a scalar map for adapter parameters. Nonblank text, safe-integer seed and finite unit-interval strength remain documented obligations without runtime validation in this type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Core prompt, seed and preservation controls remain explicit while an optional scalar map carries adapter-defined values rather than executable configuration; string values are not credential-screened here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Seed does not promise identical external output; the retained record performs no dispatch, retry or immutable request preservation.

## @evidence contracts/development/common.md#meaningful-documentation

Defines prompt presence, optional negative prompt, safe seed, strength range and adapter-defined scalar controls with reproducibility limits.
