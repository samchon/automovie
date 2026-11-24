# src/everyday/gestureAdmit.ts#gestureAdmit
## @evidence contracts/development/common.md#meaningful-documentation

States the values admitted, the sides and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The count is the parameter or the kind's rhythm, a whole number; the hold is non-negative; a bow's depth lies within `gesture.DEEPEST_BOW`; a point needs a target and an aim a shape; the sides are the kind's (`gestureStrokeTables.HANDS`: both, the named hand, or none).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cut out of `gesture.plan` as its admission; the plan then lays the strokes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every value outside its range is refused through `HumanBound` or a stated refusal; none is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure admission.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/gestureAdmit.ts#gestureAdmit.IAdmitted

## @evidence contracts/development/common.md#meaningful-documentation

States each admitted value and its unit.

## @evidence contracts/development/design.md#principled-representation

The whole stroke count, the hold in seconds, the bow depth in degrees and the moving sides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `gestureAdmit.of` to `gesture.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: every member is always present.
