# src/scene/inspection/expandAutoMovieInspectionSweep.ts#expandAutoMovieInspectionSweep

## @evidence contracts/development/common.md#meaningful-documentation

States the input, what a unit and its box are, the neighbour rule with its unit and boundary, the order, what each output member selects, the empty-neighbour case and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Two axis-aligned boxes intersect exactly when their intervals overlap on all three axes, so growing the unit's box by the margin and testing overlap finds every object within that distance along each axis; any scene that reports world boxes can answer it, whatever its subject.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, unit discovery by the shallowest matched path, unit boxes, then one overlap test per unit and object.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The margin is the caller's stated value, no path or subject kind is treated specially, and an empty match is refused instead of planning no cell.

## @evidence contracts/development/implementation.md#efficient-algorithms

Units times objects overlap tests, plus one pattern match per object and per parent path; a sweep has tens of units, where a spatial index would cost more than it saves.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and keeps nothing.
