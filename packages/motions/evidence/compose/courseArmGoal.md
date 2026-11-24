# src/compose/courseArmGoal.ts#courseArmGoal

## @evidence contracts/development/common.md#meaningful-documentation

States the defect it removes, how the goal is read, what is planned and what is kept.

## @evidence contracts/development/implementation.md#principled-implementation

A moving effector goal is a trajectory problem solved once with branch continuity and clearance (the planner's), never a fresh inverse kinematics solve per sample. The course leaves from the arm the display shows as it takes over (a plan starts from its displayed entry): the entry's at the action's start, and for a later start the plan's own arm as the display shows it there, its joints or the display's own swivel course of its goals from the entry (`courseLimbSwivels`, the same knots), never a cold fit of the goal, which may turn the arm another way for the same hand place. A law that chose the hold's grasp by its own fit hands that fit's seed (`hold`), which the course's hold continues, so the law's search and its course take one solution.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The plan less its arm goal is the composer's base; the planned carry is its one primitive; the composed posture replaces the plan's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The goal is the plan's own at each instant; no goal, bound or timing is invented, and the planner's refusal stands.

## @evidence contracts/development/implementation.md#efficient-algorithms

One course per plan, solved when composed; a course starting after its action reads its rest once, from one goal-free resolve where the plan writes no goal before it, or from one display course of the plan's goals up to its start, a continued fit per frame; at each second the plan's posture is evaluated once and shared by the base and the goal. Once laid, a second where every arm in its window is on its course asks the law for every channel but those arms, whose goals no reader takes there, so a law that honours the demand skips them.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The last evaluated posture is reused while the second, the borrowed readers and the demanded channels are the same; each set of skipped arms keeps one channel list, so the reads of a second share it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the plan, the course, one posture and the arm's ending angles, released with the plan.

# src/compose/courseArmGoal.ts#courseArmGoal.knotted

## @evidence contracts/development/common.md#meaningful-documentation

States what a knot is, which events become knots, the source of the rule, the units and the result.

## @evidence contracts/development/implementation.md#principled-implementation

trajopt imposes a pose term at a timestep (github.com/joschu/trajopt src/trajopt/problem_description.cpp at 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause; Schulman et al. 2014, IJRR 33:1251, section VII-B), so an event inside the hold, where the plan's goal is the pose the act asks, is a waypoint of the course.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter of the plan's events into the span; the planner and the laid course read the knots from the span (`AutoMovieMotionHumanArmCourse.grid`, `AutoMovieMotionHumanArmPlanned.planned`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance beyond the 1e-9 s that tells an event from the hold's own ends, which are waypoints already.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the plan's events, once per arm when the plan is coursed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new span and retains nothing.