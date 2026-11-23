# src/compose/courseArmGoal.ts#courseArmGoal

## @evidence contracts/development/common.md#meaningful-documentation

States the defect it removes, how the goal is read, what is planned and what is kept.

## @evidence contracts/development/implementation.md#principled-implementation

A moving effector goal is a trajectory problem solved once with branch continuity and clearance (the planner's), never a fresh inverse kinematics solve per sample.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The plan less its arm goal is the composer's base; the planned carry is its one primitive; the composed posture replaces the plan's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The goal is the plan's own at each instant; no goal, bound or timing is invented, and the planner's refusal stands.

## @evidence contracts/development/implementation.md#efficient-algorithms

One course per plan, solved when composed; at each second the plan's posture is evaluated once and shared by the base and the goal. Once laid, a second where every arm in its window is on its course asks the law for every channel but those arms, whose goals no reader takes there, so a law that honours the demand skips them.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The last evaluated posture is reused while the second, the borrowed readers and the demanded channels are the same; each set of skipped arms keeps one channel list, so the reads of a second share it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the plan, the course, one posture and the arm's ending angles, released with the plan.
