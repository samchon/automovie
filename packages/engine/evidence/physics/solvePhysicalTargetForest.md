# src/physics/solvePhysicalTargetForest.ts#solvePhysicalTargetForest

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted forest, residual units, fixed roots and joint coordinates.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the existing bounded target step and projected rotations with one-sided columns: each coordinate takes its slope on the side the step moves it, re-solving while a coordinate changes side (orthant-wise linearization, Andrew and Gao 2007), so a row that is the least of several linear pieces is modelled exactly to first order. It accepts a backtrack only when the measured norm falls and reports attempted updates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same joint loop and row machinery serve a single tree and a forest through their borrowed joints, bones and poses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Admits finite fixed-size residuals, caps rows and free coordinates, and keeps the best measured candidate when a step stalls.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compiles branches once, probes their moved dependencies, probes a coordinate's other side only when the step moves it there, and bounds the side rounds by the coordinate count and the update and backtracking loops.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Candidate construction copies changing subtrees and borrows the other branches from the last accepted pose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Row, coordinate and iteration caps bound work per call. Candidate scratch is local.
