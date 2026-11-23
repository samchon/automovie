# src/soft/IAutoMovieSoftBodyObserver.ts#IAutoMovieSoftBodyObserver

## @evidence contracts/development/design.md#principled-representation

One call per completed absolute step with that step's positions, velocities and the force each held particle bears.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The one callback the trajectory's consumers read; the solver's result stays the final state as before.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The buffers are the solver's working arrays, lent for the call: a reader copies what it keeps, so the solve allocates nothing per step for a reader that keeps nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States when it is called, the frames and units, the lending rule and how a held particle's force is read.
