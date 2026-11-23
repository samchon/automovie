# src/analysis/IAutoMovieRayObstruction.ts#IAutoMovieRayObstruction.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Whether any of the given convex solids stops a ray before `maxDistance`. Member documentation states the supplied records, units and absence meanings used by autoMovieRayObstructed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The query borrows canonical solids and vectors; it does not encode normalized length or admitted half-spaces, so these remain caller premises for autoMovieRayObstructed.

## @evidence contracts/development/design.md#principled-representation

origin is in world metres, direction must be unit length for metre-valued maxDistance, and solids are tested in their supplied order; Infinity permits an unbounded sky ray.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieRayObstruction.IProps, used by autoMovieRayObstructed. Its origin, direction, solids, maxDistance members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
