# src/throwing/throwObjectLever.ts#throwObjectLever.ILever

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

A rigid lever's release state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the throw's plan and the spin read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Plain vectors, a rate and the hand's turn.

# src/throwing/throwObjectLever.ts#throwObjectLever

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and when there is none.

## @evidence contracts/development/implementation.md#principled-implementation

Rigid-body kinematics about the shoulder, v(p) = u + w x (p - s): the least turn carrying the velocity's part square to the lever, its part along it shared; the implement where the hand's grip holds it, so no wrist turn is asked. Without an implement the hand translates unturned through the carry, so the hand and the held prop share the launch velocity and the aim is solved for the prop's own origin, the point the performance flies.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The working point (implement, held prop or grip) and its aim, the turn and the shared velocity, then the hand's velocity and turn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unreachable target returns undefined for the throw's refusal; a prop the hand does not hold at the entry is aimed from the grip, the launch point the performance flies such a prop from.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work after one held-tool or held-prop reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The implement's point is the held-tool reading (`StrikingHeld.of`), the prop's the held-prop reading (`AutoMovieMotionHumanHeld.of`) the performance keeps, and the aim the throw's (`throwObjectLaunch.aimed`).

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the returned closure.

# src/throwing/throwObjectLever.ts#throwObjectLever.spin

## @evidence contracts/development/common.md#meaningful-documentation

States the rate's choice, its flight time and the axis's frame.

## @evidence contracts/development/implementation.md#principled-implementation

A released rigid body keeps its angular velocity; the flight time is the horizontal distance over the constant horizontal speed of the drag-free path the launch is aimed by.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The flight time, the half turns, the axis.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The rate is derived, never typed; at least one half turn, so a knife always turns.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work after one held reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The prop's grip frame is the held reading (`AutoMovieMotionHumanHeld.of`).

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
