# src/analysis/AutoMovieAnalysisDomain.ts#AutoMovieAnalysisDomain

## @evidence contracts/development/design.md#principled-representation

A closed string union mirrored by the engine's `AUTOMOVIE_ANALYSIS_DOMAINS` table; the compiler owns membership, so no runtime check re-reads a domain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Plain literals with no per-domain metadata; ordering and the guard live in the engine table, keeping this package free of runtime values.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Membership makes no adapter or completeness claim: the envelope solver emits a solved moisture run with an unsupported interstitial-condensation metric. A wholly unavailable adapter is reported as unsupported rather than a fabricated measurement.

## @evidence contracts/development/common.md#meaningful-documentation

States why the list is closed, that membership does not imply an adapter exists, and which table fixes the rollup order.
