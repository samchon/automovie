# src/analysis/resolveAutoMovieDaylightRequest.ts#resolveAutoMovieDaylightRequest

## @evidence contracts/development/implementation.md#principled-implementation

Checks every field the request contract bounds in one ordered pass, delegates the context, shades and targets to their shared validators, and derives the measured face as the normalized cross product of the normalized axes, refusing a cross product of `1e-12` or less because parallel axes span no plane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The request check lives beside the analyzer it serves and returns what it already had to compute, the instant it looked up and the frame it normalized, so the analyzer neither looks the instant up again nor asserts it non-null.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No study or fixture is special-cased; the only constants are the `1e-12` degeneracy floor and `AUTOMOVIE_ANALYSIS_MAX_SAMPLES`, and nothing is clamped or defaulted to let a malformed request through.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why mistakes throw instead of producing an unsupported run, where the refused inputs are listed and their order, and what each returned field is and how it was derived.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the context, luminaires L, shades with their planes, and targets, with hashed id uniqueness; the grid cell count is checked by one product instead of enumerating cells.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The instant lookup and the frame normalization are done once here and handed to the analyzer, which reuses them for every cell instead of repeating them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The luminaire id set and the context validation result are call-local; the returned record holds three new vectors and a reference to the context's instant, owned by the caller.
