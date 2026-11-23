# src/animals/QuadrupedChange.ts#QuadrupedChange.Rule

## @evidence contracts/development/common.md#meaningful-documentation

States each rule and its members' units.

## @evidence contracts/development/design.md#principled-representation

A closed union of the change rules the sources give, with their own variables.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; a gait's `AutoMovieArchetypeQuadrupedGait.IGait.change`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed kinds, not free text.

# src/animals/QuadrupedChange.ts#QuadrupedChange.point

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

By the declared rule: Froude scaling on hip height, a mass power law, a stated reference speed times the table's existing scale, or the midpoint of overlapping ranges. A producer labels authored speed thresholds instead of claiming measured transitions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per rule.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeQuadrupedGait.range`; the hip's height is the caller's, read off the animal.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/QuadrupedChange.ts#QuadrupedChange.called

## @evidence contracts/development/common.md#meaningful-documentation

States the rule.

## @evidence contracts/development/implementation.md#principled-implementation

A declared speed rule includes its upper-gait boundary, admitting the first authored speed exactly; other rules retain strict upward comparison. All downward comparisons remain strict, and the hysteresis gap scales with the table's existing rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two loops over the species' gaits.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one step each way per gait.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `point`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
