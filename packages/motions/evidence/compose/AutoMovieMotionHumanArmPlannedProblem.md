# src/compose/AutoMovieMotionHumanArmPlannedProblem.ts#AutoMovieMotionHumanArmPlannedProblem

## @evidence contracts/development/common.md#meaningful-documentation

States the waypoints, their spacing, the problem and what they read.

## @evidence contracts/development/implementation.md#principled-implementation

The reach and the return are spaced by the arc their blend covers, the hold at the least spacing, and every knot and each arm's own hold is a waypoint, as trajopt imposes a pose term at a timestep (github.com/joschu/trajopt src/trajopt/problem_description.cpp; Schulman et al. 2014, section VII-B); a first cut has at most ten intervals, TrajOpt's eleven timesteps (Schulman et al. 2013, section VI). A site on a segment of another arm of the group rides that arm; a grip on an object both hands hold rides the lead hand's own site.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The waypoints' cut and the problem, moved verbatim from `AutoMovieMotionHumanArmPlanned.planned`, read the scope the plan hands them; the plan's least waypoints a second and spacing are read from the scope.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every site is the arm's goal's own contact at its instant; nothing is interpolated.

## @evidence contracts/development/implementation.md#efficient-algorithms

The waypoints are cut only on fallback; each arm's site is read once per instant however often the refinement reads the problem again.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same site record each time lets the solve keep what it built on it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns the waypoints, the site maps and the guesses until it returns or throws.

# src/compose/AutoMovieMotionHumanArmPlannedProblem.ts#AutoMovieMotionHumanArmPlannedProblem.IScope

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the plan holds.

## @evidence contracts/development/design.md#principled-representation

The plan's own values and readings, named, so the problem reads them explicitly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Eleven members, each read by the cut or the problem.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The scope holds the plan's values as they are; nothing is copied or derived.

# src/compose/AutoMovieMotionHumanArmPlannedProblem.ts#AutoMovieMotionHumanArmPlannedProblem.IReaders

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its inputs and result.

## @evidence contracts/development/design.md#principled-representation

The plan's own waypoints, their cut, the problem builder and the setter of the guesses the problem reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, each read by the plan or its solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The guesses are set once, by the solve that refuses the laid course.
