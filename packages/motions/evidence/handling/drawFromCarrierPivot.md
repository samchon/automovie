# src/handling/drawFromCarrierPivot.ts#drawFromCarrierPivot
## @evidence contracts/development/common.md#meaningful-documentation

States the two stages (the slide along the line, then the turn about the hanger), the closed forms each solves and what happens when neither brings the wrist within reach.

## @evidence contracts/development/implementation.md#principled-implementation

Both stages are closed forms: the slide is the least root of the quadratic in the slide length that puts the drawn wrist at `operate.REACH` of the arm's length from the shoulder, bounded by the pulling hand's own reach; the turn is the law-of-cosines angle `phi - acos(c)` about the hanger.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `drawFromCarrier` as the pulled carrier's pivot: the slide and the turn are its one responsibility; the reach check that follows stays in the plan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A wrist already within reach needs neither stage; one that neither stage brings within reach is turned straight at the shoulder and left to the reach check, which refuses it. No nudge or retry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one quadratic and one inverse cosine, plus the entry reads of the shoulder and hanger.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; the plan keeps its result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/drawFromCarrierPivot.ts#drawFromCarrierPivot.IRoots

## @evidence contracts/development/common.md#meaningful-documentation

States the quantity, its unit and where the reach holds.

## @evidence contracts/development/design.md#principled-representation

The two roots of the slide quadratic, metres along the line.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced and read only inside `drawFromCarrierPivot`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No root is optional: a slide with no real root has no record (`null`).

# src/handling/drawFromCarrierPivot.ts#drawFromCarrierPivot.IPivot

## @evidence contracts/development/common.md#meaningful-documentation

States what each reader gives and by which share.

## @evidence contracts/development/design.md#principled-representation

Two world-frame readers by the pivot's share (and the slider's travel, metres, for the blade).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `drawFromCarrierPivot` and read by the draw plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: both readers are always given.
