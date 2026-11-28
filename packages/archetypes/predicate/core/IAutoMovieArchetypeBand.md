# src/core/IAutoMovieArchetypeBand.ts#IAutoMovieArchetypeBand.maximum

## @evidence contracts/development/common.md#meaningful-documentation

Explains the upper bound and its fixed-value case.

# src/core/IAutoMovieArchetypeBand.ts#IAutoMovieArchetypeBand.minimum

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the inclusive lower bound in the shared unit.

# src/core/IAutoMovieArchetypeBand.ts#IAutoMovieArchetypeBand.provisional

## @evidence contracts/development/common.md#meaningful-documentation

Explains how estimated or secondary-source measurements are marked.

# src/core/IAutoMovieArchetypeBand.ts#IAutoMovieArchetypeBand.source

## @evidence contracts/development/common.md#meaningful-documentation

Names the measurement, reference or estimate that owns the recorded interval.

# src/core/IAutoMovieArchetypeBand.ts#IAutoMovieArchetypeBand.unit

## @evidence contracts/development/common.md#meaningful-documentation

States the unit shared by both endpoints.

# src/core/IAutoMovieArchetypeBand.ts#IAutoMovieArchetypeBand

## @evidence contracts/development/common.md#meaningful-documentation

States the inclusive finite interval, measurement source and seeded and unseeded admission rules.

## @evidence contracts/development/design.md#principled-representation

The endpoints carry one unit and may coincide for a fixed value. The `of` factory enforces finite ordered endpoints and preserves the source and optional provisional mark.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A producer shares this record with draw sessions and dimension provenance. Catalogue selections have their own figures and use the same unit type.
