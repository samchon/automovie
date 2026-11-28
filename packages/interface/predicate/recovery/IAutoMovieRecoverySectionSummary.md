# src/recovery/IAutoMovieRecoverySectionSummary.ts#IAutoMovieRecoverySectionSummary

## @evidence contracts/development/common.md#meaningful-documentation

Counts connect retained stations and fitted curves with bracketed event candidates and exact source aliases.

## @evidence contracts/development/design.md#principled-representation

Point and span totals are accumulated from each retained plane. Event candidates and aliases use their separate source populations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The extraction stage owns these counts. A later loft or surface writer has its own generated geometry counts.

# src/recovery/IAutoMovieRecoverySectionSummary.ts#IAutoMovieRecoverySectionSummary.observations

## @evidence contracts/development/common.md#meaningful-documentation

Each successful fit contributes its observed point count to the station total. Contact-only contours contribute their own diagnostics.

# src/recovery/IAutoMovieRecoverySectionSummary.ts#IAutoMovieRecoverySectionSummary.spans

## @evidence contracts/development/common.md#meaningful-documentation

The observation sums each published fit's cubic span count before separating the open and closed populations.

# src/recovery/IAutoMovieRecoverySectionSummary.ts#IAutoMovieRecoverySectionSummary.sections

## @evidence contracts/development/common.md#meaningful-documentation

The extraction returns the prepared station cache size, equal to the retained section and report populations.

# src/recovery/IAutoMovieRecoverySectionSummary.ts#IAutoMovieRecoverySectionSummary.events

## @evidence contracts/development/common.md#meaningful-documentation

The count comes from the bracketed candidate list. An event can stay unconsumed because its two cuts were not both retained or because neither cut has a supported closed loop.

# src/recovery/IAutoMovieRecoverySectionSummary.ts#IAutoMovieRecoverySectionSummary.aliases

## @evidence contracts/development/common.md#meaningful-documentation

With exact aliases enabled, extraction subtracts the distinct source coordinates from the original vertex population. Otherwise it returns zero.
