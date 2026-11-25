# src/compose/AutoMovieMotionHumanSwivelBound.ts#AutoMovieMotionHumanSwivelBound.arm

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and on what.

## @evidence contracts/development/implementation.md#principled-implementation

The posed trunk carries the shoulder; the lengths are the rig's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One posture solve and three reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One actual limb-free canonical solve keeps direct joint admission and only proven requested-goal selection, followed by shoulder/elbow/wrist FK ancestry/output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One explicit local reader shares exact canonical/FK prerequisites; the posture and FK numerical owners retain every required actual operation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The three-name demand, pose/map and local lazy reader end on return/throw; only original shoulder/length values escape.

# src/compose/AutoMovieMotionHumanSwivelBound.ts#AutoMovieMotionHumanSwivelBound.admits

## @evidence contracts/development/common.md#meaningful-documentation

States the two conditions and what a search may conclude.

## @evidence contracts/development/implementation.md#principled-implementation

The same circle and exact refused arcs as `bounded` (`swivelArcs`): the union covering every swivel, or no circle at all, leaves no reaching elbow in the bounds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The reach, the circle, one sinusoid per bound, their union.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact roots; the reach is `bounded`'s, a wrist on its edge or beyond leaving no circle.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per bound, no fit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The circle and the sinusoid arcs `bounded` builds, through the engine's fit, arcs and union (`swivelArcs`).

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanSwivelBound.ts#AutoMovieMotionHumanSwivelBound.bounded

## @evidence contracts/development/common.md#meaningful-documentation

States the choice, the step inside and the cases that keep the hint.

## @evidence contracts/development/implementation.md#principled-implementation

Each bound is an exact sinusoid of the swivel, its refused arc between its roots; the nearest swivel outside their union is the least move that meets them all. That end lies on a bound, and a fit keeps a hint's swivel only to its own resolution, so a hint at the end left the fitted elbow on either side of the bound (a drink refused at a flexion of 67.50 against at most 67.5); the hint stands that resolution inside, unless that enters another refused arc.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The circle, one sinusoid per bound, their union and its nearest swivel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sweep and no sampling beyond the exact three-point fit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per bound.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The engine's fit, arcs and union (`swivelArcs`).

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
