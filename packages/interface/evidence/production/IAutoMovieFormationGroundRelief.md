# src/production/IAutoMovieFormationGroundRelief.ts#IAutoMovieFormationGroundRelief.IFormation

## @evidence contracts/development/common.md#meaningful-documentation

States relief semantics, all zero cases, first-surface precedence and object-identity cache lifetime.

## @evidence contracts/development/design.md#principled-representation

The existing grounding contract supplies optional ordered terrain; anchor is a world-metre point. Immutability after use is a caller obligation rather than a deep readonly guarantee.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses IAutoMovieFormationGrounding and adds only the anchor needed by formationGroundRelief's cached datum lookup.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing terrain does not invent a walkable plane; zero relief preserves the authored anchor height, including intentional offsets above terrain.
