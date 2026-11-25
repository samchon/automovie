# src/handling/putDownRestingDemand.ts#putDownRestingDemand

## @evidence contracts/development/common.md#meaningful-documentation

States which placements demand a pose, what the pose is, the line it is judged on and the source of the rule.

## @evidence contracts/development/implementation.md#principled-implementation

The destination prop frame P and the prop-in-grip offset O give the grip frame P O^-1; the pose is judged on the prop's up axis through its origin over a hand's length, the two points `putDown`'s authored limits hold, to the same held-tool bound (`StrikingRoll.MISS`). The grasp is chosen for the goal posture (Rosenbaum, Meulenbroek, Vaughan and Jansen 2001).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Filter the placement and the grip, read the grip's hold of the prop, build the up-axis line and declare one demand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No prop kind is named; a placement with no authored attitude, a socket or a bone placement, or another grip asks nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant rigid-frame work per candidate grasp, at plan time; no fit and no body solve of its own.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the grip's held-tool reading, `HumanPropFrame.parent` and the held-tool bound.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one demand and retains nothing.
