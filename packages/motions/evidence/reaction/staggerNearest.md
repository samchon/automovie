# src/reaction/staggerNearest.ts#staggerNearest

## @evidence contracts/development/common.md#meaningful-documentation

States the projection, its premise of a nonempty convex floor outline and its readers.

## @evidence contracts/development/design.md#principled-representation

Floor points in one metre frame; a prepared outline keeps its copied corners and each edge's difference and squared span, never a projected answer.

## @evidence contracts/development/design.md#minimal-and-owned-surface `of` for one query and `prepare` for the settling loop's many queries on one fixed outline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No margin, sampled pressure or remembered answer is stored.

# src/reaction/staggerNearest.ts#staggerNearest.of

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the inside rule and the tie rule.

## @evidence contracts/development/implementation.md#principled-implementation

Containment by the engine's `pointInHull`, then every closed edge's clamped projection, the nearest kept; a collapsed edge projects to its corner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One kernel shared with `prepare`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No margin or tolerance moves the point.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(v) containment and edge projections for v corners.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/reaction/staggerNearest.ts#staggerNearest.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States what is copied and what each query returns.

## @evidence contracts/development/implementation.md#principled-implementation

The same kernel as `of`, its edges' differences and squared spans computed once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One copy of the corners and one edge record each, then the shared kernel per query.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every query runs the containment test and every edge projection; no answer is kept.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(v) preparation once; each O(v) query skips the edge arithmetic that does not change.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The outline is copied, so the prepared edges stay those of the outline given whatever the caller does with it after.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader holds v corners and v edge records until its caller, the settling loop, releases it; a returned point never exposes a private corner.
