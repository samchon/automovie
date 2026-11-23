# src/production/sound/IAutoMovieLoudnessMeter.ts#IAutoMovieLoudnessMeter

## @evidence contracts/development/common.md#meaningful-documentation

States the standard, the rate, who creates it, that pushes may split frames, that `measure` reads without disturbing, and its consumers.

## @evidence contracts/development/design.md#principled-representation

A streaming accumulator, so a film-length decode is measured without holding its samples. The channel count and 48 kHz rate are fixed at creation, which engine's factory checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the contract so the delivery host, which cannot import engine, receives a meter through the production's render. Two methods, both used by every consumer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No consumer-specific option exists; mono and stereo share one surface.

# src/production/sound/IAutoMovieLoudnessMeter.ts#IAutoMovieLoudnessMeter.IMeasurement

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and when it is null.

## @evidence contracts/development/design.md#principled-representation

LUFS and dBTP with null for the states the standard leaves undefined: no block over the absolute gate, and digital silence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The leveller and master read the loudness, the analysis and delivered check read both, and the frame count lets a caller confirm coverage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null is not replaced by a sentinel such as −Infinity.
