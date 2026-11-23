# src/production/IAutoMovieGeometryQuery.ts#IAutoMovieGeometryQuery

## @evidence contracts/development/design.md#principled-representation

Query-discriminated operands select distance, rig reach, resolved pose, ground, formation, effect, exact film time or camera projection; the production oracle establishes compile freshness before measureAutoMovieGeometry resolves their current records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each arm carries only its question's selectors and time, keeping render capture separate from numerical geometry; optional shot identity disambiguates actors without making every world query name a shot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A stale compile, missing selector or ambiguous actor is refused rather than measured from a guessed shot; camera root projection is not presented as an occlusion measurement.

## @evidence contracts/development/common.md#meaningful-documentation

Gives each query's operands, shot-local second units and default times, exact global frame input, actor disambiguation and the root-projection visibility limitation.
