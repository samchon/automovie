# src/handling/HumanGraspSearch.ts#HumanGraspSearch

## @evidence contracts/development/common.md#meaningful-documentation

Defines the fixed inputs, each query argument and the result; HumanGrasp.reachable documents the cost, the stroke, the required measure and the admission.

## @evidence contracts/development/implementation.md#principled-implementation

Candidates are taken in stable nondecreasing grasp-error-plus-preference order; the grasp error bounds a candidate's cost from below, since stroke keys only add to it, so the search stops at the first candidate no cheaper than the best that holds the required measure. A fit's rotation error is the solver's own optimum over legal swivels where it reports one, continuous in the key (Berge's maximum theorem).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fit adapter, one candidate list, one ordered loop over each candidate's lazily built stroke keys.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

With no admitted candidate the search considers the full set. A fixed grasp can be pruned by its preference only after a complete admissible winner exists; the strict initial gap preserves stable ties.

## @evidence contracts/development/implementation.md#efficient-algorithms

With a fixed posture and a unique low-cost winner, only that grasp, its stroke and its published full pose need fitting. Overlapping lower bounds retain the full stable sort. The ordinary public query retains all C grasp fits and its goal callback order.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The FK workspace shares only rig dependency data; each fit resolves its own posture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Candidate fits are local to a query. With a fixed posture, only the winning grasp needs its full published pose. Unknown judges always receive all solved bones.
