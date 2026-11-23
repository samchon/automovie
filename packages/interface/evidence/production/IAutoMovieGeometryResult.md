# src/production/IAutoMovieGeometryResult.ts#IAutoMovieGeometryResult

## @evidence contracts/development/design.md#principled-representation

A discriminated union separates Euclidean distance, terrain sample and query-specific scalar summaries; engine query adapters derive values from the supplied current compiled records and refuse unresolved selectors.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Dedicated distance and ground fields expose their fixed units, while the measurement map carries heterogeneous named metrics for reach, formation, camera, effect, pose and film-time queries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No containing ground surface yields the explicit zero-height, null-surface, non-walkable result; unresolved actors or landmarks throw rather than being returned as successful zero distances.

## @evidence contracts/development/common.md#meaningful-documentation

Defines result kinds, meter units, terrain absence and the query-dependent metric map whose individual units belong to the requested query.
