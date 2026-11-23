# src/posture/HumanArmTrajectoryStretch.ts#HumanArmTrajectoryStretch.IGrid

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The problem reader, the context builder, the frame grid's seconds and its context.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the refinement reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The grid is the admission's own.

# src/posture/HumanArmTrajectoryStretch.ts#HumanArmTrajectoryStretch.IKnots

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

Grid indices, the problem on their seconds and its context.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a refinement replaces.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The problem and the context are the knots' own.

# src/posture/HumanArmTrajectoryStretch.ts#HumanArmTrajectoryStretch.ISolved

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The optimiser's result on the knots and the played interpolant's frame-grid reading.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the planner admits, splices and refuses by.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The played reading is the admission's own.

# src/posture/HumanArmTrajectoryStretch.ts#HumanArmTrajectoryStretch.snap

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the rule and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A knot is a grid instant, so a stretch refined to the end is bounded at exactly the instants it is read at.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One merge of two ascending lists.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both ends are kept.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the grid and the seconds.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmTrajectoryStretch.ts#HumanArmTrajectoryStretch.on

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The problem is read on the knots' grid seconds and its context continues the grid's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading and one context.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is kept from other knots but what the context builder shares.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the knots.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The context builder keeps every waypoint record already built on the grid.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmTrajectoryStretch.ts#HumanArmTrajectoryStretch.optimise

## @evidence contracts/development/common.md#meaningful-documentation

States the solve, the refinement, its bound and its early end.

## @evidence contracts/development/implementation.md#principled-implementation

TrajOpt's penalty SCP on knots with the continuous check's interval refinement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optimisation, then one bounded split-and-solve loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The played reading is the frame-grid admission's; no start but the seed is tried.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost class: one penalty SCP over the knots' variables, read on the stretch's frame grid, at most `REFINEMENTS` more solves, each splitting only failing intervals; linear in the stretch's frames per evaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A refinement carries the path on its own interpolant and solves from it at the penalty reached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh coordinates; retains nothing.

# src/posture/HumanArmTrajectoryStretch.ts#HumanArmTrajectoryStretch.refused

## @evidence contracts/development/common.md#meaningful-documentation

States what is named and when the solution is told.

## @evidence contracts/development/implementation.md#principled-implementation

Hollerbach's time scaling for a speed-bound miss; the worst term otherwise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One worst term, one refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The worst of the knots' and the played reading's misses is named.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the knots and frames.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the solve as it stands.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Tells the solution only for a `duration` refusal.

# src/posture/HumanArmTrajectoryStretch.ts#HumanArmTrajectoryStretch.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the problem's ends, the seed, the one solve and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

TrajOpt from a straight joint-space interpolation (Schulman et al. 2014, section VI), on the plan's mirror rule (`HumanArmTrajectoryMirror`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading, one seed, one `optimise`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No warm start, laid course, repair or planner seed is tried after it; the refusal stands.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost class: one `optimise` over the stretch's knots on its own frame grid, nothing outside the stretch read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The context builder shares every waypoint record across the refinement's readings.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned readers retain only the setups, the knots' times and their coordinates.
