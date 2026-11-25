# src/touch/armWrestle.ts#armWrestle.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusals; the law's doc gives the geometry and the phases.

## @evidence contracts/development/implementation.md#principled-implementation

The clasp height and the two elbows follow from the two forearms; the lean is the root of the shoulder-to-elbow distance less the upper arm, bisected over the trunk's pitch; the forearm's turn is a rotation about the elbows' line, which keeps both forearms' lengths; the pin's range is read from the arm the posture resolver fits, by the elbow's whole place; the loser's trunk bends toward the pin by `HumanForceTrunk.share` of the torque its shoulder resists with, as the pin comes, bounded by the largest share that keeps the shoulder an upper arm from the planted elbow.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared geometry, the lean, the clock, the posture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A lean that cannot close the distance throws; the sway is a fixed sine, not a draw, so the two roles stay together.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bisection of twenty-four trunk resolves and one posture resolve per five degrees up to the asked pin at plan time, and for a loser whose resisted bend would lift the elbow one more bisection of twenty-four trunk-only shoulder reads; constant work per frame before the posture resolve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to the bow, trunk, full posture resolver and arm carry. All original twenty-four lean probes re-read the borrowed entry through ordinary bowed, sharing only fixed raw-shoulder name/rig metadata; raw root/heading getters are never frozen. Changing runtime postures also use ordinary bowed, and the complete same-body base evaluation receives only its current synchronous FK/ROM loan. Pin trials share one genuine unchanged-body ROM projector and prepared elbow FK demand; every changed pin angle still solves the complete pose and keeps rival clearance.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan closes over its base, geometry and entry arm angles. Planning-only exact FK, genuine ROM metadata and prepared elbow readers end on return or refusal; returned evaluators retain none of those workspaces.
