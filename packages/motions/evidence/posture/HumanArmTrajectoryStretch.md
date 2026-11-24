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

States the solve, what it reads, when an interval is split and the passes' bound.

## @evidence contracts/development/implementation.md#principled-implementation

TrajOpt's penalty SCP on knots, whose reading of the knots and the course between them through every frame played is the admission; where the course between knots fails, the knots lack freedom there, so the intervals whose sweeps fail, or that hold a failing frame strictly between their knots, are split and the path solved on, warm, from its own solution at the penalty reached (trajopt subdivides only an interval past its longest valid segment; Schulman et al. 2013, section V).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optimisation, then splits of the intervals a swept miss or a failing frame between knots lies in, read from the evaluation's own sweeps and failing frames, each pass continuing the last.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No retry or second start; no knot is added for a miss at the knots themselves, and no tuned pass count or progress share stops it: an interval of one frame is never split.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost class: one penalty SCP over the knots' variables per pass, each reading linear in the stretch's frames; each pass halves the intervals it splits, so the passes are at most the base-two logarithm of the longest interval's frames, and none follows a solve that meets its reading or misses at its knots.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A split pass carries the path on its own interpolant and solves from it at the penalty reached; the solve's last evaluation is the played reading, never read again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh coordinates; retains nothing.

# src/posture/HumanArmTrajectoryStretch.ts#HumanArmTrajectoryStretch.refused

## @evidence contracts/development/common.md#meaningful-documentation

States what is named and when the solution is told.

## @evidence contracts/development/implementation.md#principled-implementation

A path that breaks anything but its speed is refused for that term (`placement`), since no longer span meets it; a path that breaks only its speed is refused for time by Hollerbach's scaling.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One worst term, one refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The worst of the knots' and the played reading's misses is named, its geometric term before its speed.

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
