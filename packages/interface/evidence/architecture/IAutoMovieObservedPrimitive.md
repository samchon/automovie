# src/architecture/IAutoMovieObservedPrimitive.ts#IAutoMovieObservedPrimitive

## @evidence contracts/development/design.md#principled-representation `validateDesignReference` resolves the frame, looks the kind up in one table of exact or minimum point counts, checks every point is finite and inside the frame's extent, and requires literal text exactly for `text` and `level-marker`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record covers every mark family with a point list and an optional literal, and the per-family point counts live in a single validator table rather than in six record types.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Stored points remain in source units and arc/text/level-marker families are withheld from metric outline promotion. The gate checks authored family/count/range/text consistency, not whether pixels really contain the mark, distinct line endpoints, a simple region or its closure/area; a promoted line/polyline/region remains authored evidence rather than certified geometry recognition.

## @evidence contracts/development/common.md#meaningful-documentation

States that a primitive carries no meaning, the point count of every family, which families can become metric geometry, and when text is present or null.
