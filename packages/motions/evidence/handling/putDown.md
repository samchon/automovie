# src/handling/putDown.ts#putDown.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusals; the law's doc gives the phases.

## @evidence contracts/development/implementation.md#principled-implementation

The hand-to-prop offset is read from the displayed frames at the start and inverted at the resting frame; a free heading is chosen by the grasp search over turns of the prop's own rest rotation the whole way round (`HEADINGS`), since a prop laid with no authored heading rests alike at any, and a socket placement holds the source socket as the arm's contact. A placement that stays put is one admitted arm course (courseArmGoal): joint-space carry and return between arms the body takes, the hold on the placing frame, so no world-attitude path switches the forearm's twist between its range's ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The offset, the resting frame, the wrist, the reach check, the timing, the posture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A wrist beyond the arm is refused, never clamped; the tilt the carry gives the prop is discarded for its rest rotation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two demanded hand readings, at most one heading search and one posture solve for the hanging hand at plan time; a placement that stays put adds one arm course solved when composed, then constant work per frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanGrasp.reachable`, `putDownTarget`, the held-tool goal, `HumanPrehension` and the pick up's reach and the planner's course (courseArmGoal).

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan closes over the transports, the shapes, the reference and the wrist.

# src/handling/putDown.ts#putDown.demands

## @evidence contracts/development/common.md#meaningful-documentation

States which placements constrain a prior grasp (a socket placement, and a free one at an authored resting attitude through `putDownRestingDemand`) and whose pose and tolerance are used.

## @evidence contracts/development/implementation.md#principled-implementation

The destination prop frame P and prop-in-grip offset O require the grip frame P O^-1; the same source-socket contact and held-tool bound as the placing plan judge it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Filter the grip and tracked destinations, read the fixed destination, undo its rigid offset and declare one demand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No object kind is named; a free world placement with no authored attitude keeps its existing freedom.

## @evidence contracts/development/implementation.md#efficient-algorithms

One destination lookup and constant rigid-frame work per candidate grasp; the body pose is supplied lazily and this prop-socket branch never acquires its formerly unused full posture solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The plan and demand share putDownTarget and the held-tool goal and measure owners.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one immutable demand and retains nothing.
