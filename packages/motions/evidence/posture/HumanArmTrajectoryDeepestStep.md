# src/posture/HumanArmTrajectoryDeepestStep.ts#HumanArmTrajectoryDeepestStep

## @evidence contracts/development/common.md#meaningful-documentation

States which probes are read over which step, the screen before each exact reading, and what is returned when no probe passes its allowance.

## @evidence contracts/development/implementation.md#principled-implementation

Trajopt's per-step contact (Schulman et al. 2014, section IV-C): each probe's chord over the step, carried into the shape's frame, is read exactly (`physicalShapeNearest`), the step between two poses as trajopt reads it (section IV-B), with no correction for the course between them; the deepest probe past its allowance is the step's one contact. Verdict change: the bend estimate (an eighth of the second difference about each frame) and the stray are removed, as neither bounded the course between the poses, so fewer steps are sweeps.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moved out of `HumanArmTrajectorySweep` unchanged so that file stays under its size limit; `links` owns which steps reach it and this owns the probes of one step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A probe is left unread only where the shape's bounding sphere shows it within its allowance or no deeper than the deepest so far, branch and bound that changes no answer. Limit, as in trajopt: the course between the two poses is not read, so a course that curves into the shape between frames whose chords clear it passes.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(p) screens for the part's p probes and an exact nearest-point query only where a screen fails; two carries per probe.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments; the caller keeps the returned sweep on the iterate's evaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh record or none and retains nothing.
