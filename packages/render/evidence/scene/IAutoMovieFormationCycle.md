# src/index.ts#IAutoMovieFormationCycle

## @evidence contracts/development/design.md#principled-representation

A repertoire maps gait names to equally sampled rest-to-posed affine tables, with one active take and shared uniform cells; anonymous members supply phase and instance transforms rather than independent skeletons.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates per-figure baked tables from per-unit cadence and per-member phase, matching the instanced vertex shader's actual input responsibilities.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Gaits come from the model's declared repertoire and fallback is an actual baked take; no member-specific pose library or named crowd fixture is embedded here.

## @evidence contracts/development/common.md#meaningful-documentation

Explains why anonymous members use tables, wraparound samples, part-name indexing, active/fallback takes and material-shared uniform cells.
