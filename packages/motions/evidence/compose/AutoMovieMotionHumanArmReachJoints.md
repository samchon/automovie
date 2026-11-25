# src/compose/AutoMovieMotionHumanArmReachJoints.ts#AutoMovieMotionHumanArmReachJoints.IFreeAngles

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its joint.

## @evidence contracts/development/design.md#principled-representation

Tolani, Goswami and Badler 2000 (section 3.3): the shoulder's three angles, the hinge, and the wrist's three as one spherical joint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by the attitude choice (`AutoMovieMotionHumanArmReach`), read by `terms` and `displaced`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Three joint poses, no derived value kept.

# src/compose/AutoMovieMotionHumanArmReachJoints.ts#AutoMovieMotionHumanArmReachJoints.IAxisRanges

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its axis and when it is null.

## @evidence contracts/development/design.md#principled-representation

The three axis ranges a chart's angles are aliased against.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read only by `aliased`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An immobile axis is null, not a zero range.

# src/compose/AutoMovieMotionHumanArmReachJoints.ts#AutoMovieMotionHumanArmReachJoints.IRanges

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its joint and the twist the forearm's range reads.

## @evidence contracts/development/design.md#principled-representation

The rig's own constraints of the three played joints in the fit's frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by `rangesOf`, read by `terms` and the alias reading.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The rig's constraints as they are, null where absent.

# src/compose/AutoMovieMotionHumanArmReachJoints.ts#AutoMovieMotionHumanArmReachJoints.IClamps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its joint.

## @evidence contracts/development/design.md#principled-representation

The rig's own clamps of the three played joints (`clampJointToSkeleton.of`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by `clampsOf`, read by `displaced`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The rig's clamps themselves, so the check is the rig's own.

# src/compose/AutoMovieMotionHumanArmReachJoints.ts#AutoMovieMotionHumanArmReachJoints.IDisplaced

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its content and unit.

## @evidence contracts/development/design.md#principled-representation

One joint axis and how far the rig's clamp moves it, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by `displaced`, read by `beyond` and the constraint of Table 3.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The displacement itself; no flag stands for it.

# src/compose/AutoMovieMotionHumanArmReachJoints.ts#AutoMovieMotionHumanArmReachJoints.IPast

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its content and unit.

## @evidence contracts/development/design.md#principled-representation

The joint, on the arm's own side, its axis and how far past its range, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by `beyond`, read by the attitude choice's refusal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Named on the arm's own side, never its mirror image's.

# src/compose/AutoMovieMotionHumanArmReachJoints.ts#AutoMovieMotionHumanArmReachJoints.aliased

## @evidence contracts/development/common.md#meaningful-documentation

States the alias rule and its parameters.

## @evidence contracts/development/implementation.md#principled-implementation

The full-turn alias nearest each axis's range (`nearestAngleAlias`), as the rig reads a chart.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One alias per axis.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No angle is wrapped by hand; an immobile axis reads against zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three closed-form aliases.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh values and retains nothing.

# src/compose/AutoMovieMotionHumanArmReachJoints.ts#AutoMovieMotionHumanArmReachJoints.rangesOf

## @evidence contracts/development/common.md#meaningful-documentation

States the joints and the frame.

## @evidence contracts/development/implementation.md#principled-implementation

The rig's own constraints (`getConstraint`) of the fit frame's shoulder, forearm and hand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup per joint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No range is assumed; an absent one is null.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three lookups.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh values and retains nothing.

# src/compose/AutoMovieMotionHumanArmReachJoints.ts#AutoMovieMotionHumanArmReachJoints.terms

## @evidence contracts/development/common.md#meaningful-documentation

States F's terms and the twist's range.

## @evidence contracts/development/implementation.md#principled-implementation

Tolani, Goswami and Badler 2000, section 3.3: F sums every angle but the elbow's hinge; the distal twist is read against the forearm's twist range since the rig takes it there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One add per term.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An immobile axis is no term.

## @evidence contracts/development/implementation.md#efficient-algorithms

Six closed-form terms.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh values and retains nothing.

# src/compose/AutoMovieMotionHumanArmReachJoints.ts#AutoMovieMotionHumanArmReachJoints.clampsOf

## @evidence contracts/development/common.md#meaningful-documentation

States the joints and the source.

## @evidence contracts/development/implementation.md#principled-implementation

The rig's own clamp (`clampJointToSkeleton.of`), coupled limits included.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One clamp per joint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The rig's clamps, no copy of their ranges.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three clamp preparations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh values and retains nothing.

# src/compose/AutoMovieMotionHumanArmReachJoints.ts#AutoMovieMotionHumanArmReachJoints.displaced

## @evidence contracts/development/common.md#meaningful-documentation

States the joints, the twist's placement and the order.

## @evidence contracts/development/implementation.md#principled-implementation

Each axis's displacement by the rig's own clamp: the limits the solution is checked against and Table 3 is constrained by.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over three joints, three axes each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The forearm takes the distal twist, the hand none, as the rig places it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three clamps, nine differences.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh values and retains nothing.

# src/compose/AutoMovieMotionHumanArmReachJoints.ts#AutoMovieMotionHumanArmReachJoints.beyond

## @evidence contracts/development/common.md#meaningful-documentation

States the tolerance, the side naming and the null answer.

## @evidence contracts/development/implementation.md#principled-implementation

The farthest axis past the rig's range beyond `ROM_TOLERANCE`, named on the arm's own side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the displacements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tolerance is the rig's; no other bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the nine displacements.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh values and retains nothing.
