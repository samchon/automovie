# src/production/IAutoMovieProductionVideoProbe.ts#IAutoMovieProductionVideoProbe

## @evidence contracts/development/design.md#principled-representation

The CLI's `readAutoMovieDeliveryProbe` reads coded raster, track display and matrix, aspect, edit lists, sample boundaries and color boxes; media timescale divided by constant sample duration yields the reduced rational frame rate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Convenient compatibility scalars accompany raw parsed clock and picture groups so final delivery can compare exact sample and presentation facts without reparsing the track.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Container facts are observed rather than taken from manifest claims; absent or non-sRGB color remains unresolved, and unsupported delivery transforms or clocks are rejected by the separate profile gate rather than silently normalized.

## @evidence contracts/development/common.md#meaningful-documentation

Defines parsed track facts, pixel and fixed-point units, rational rate, movie/media clock domains, decode/composition timestamps and observed versus resolved color identity.
