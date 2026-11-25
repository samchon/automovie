# src/everyday/restCrossedArms.ts#restCrossedArms

## @evidence contracts/development/common.md#meaningful-documentation

States how the upper arms are set, where each palm lies and how the elbows' width is found.

## @evidence contracts/development/implementation.md#principled-implementation

Each arm's goal lies on the other arm's surface, so both upper arms are fixed first and the one free width is solved for the forearm's length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One elbow placement, one palm goal and one bisection of the width.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An infeasible width keeps the nearest feasible one, as stated; the least flexion is named provisional.

## @evidence contracts/development/implementation.md#efficient-algorithms

A 30-step width bisection retains every closed-form goal query. One observational posture solve demands only the actual shoulder-parent frames, falling back to full fitting when dependencies require it; shoulder frames, lengths, directions and elbow forward/down geometry are prepared once per plan. Native scalar distance and addScaled owners preserve the original read/arithmetic order while omitting discarded separation/scaled-offset records in every actual width trial.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A same-operation exact FK reader serves the admitted shoulder solve, shoulder frames and raw sternum. Bisection trials share fixed body geometry, both actual palm offsets, read once and clamped shoulder origins; each changed width computes its two elbows once for both hand surfaces and excesses. The universal resolver owns the safe fit dependency proof and preserves full fallback.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
