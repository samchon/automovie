# src/soft/IAutoMovieSoftBodyState.ts#IAutoMovieSoftBodyState

## @evidence contracts/development/design.md#principled-representation

The solver restarts from the selected rest configuration and integrates to an absolute integer step, returning flat position/velocity arrays plus speed, structural strain and last-step projection counts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result retains its domain and named state with the fixed-clock time, allowing independently sought frames to be compared without hidden accumulated state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

maxSpeed is computed rather than capped to referenceSpeed; contacts counts applied projections, not unique contacts or proof that all overlapping colliders are satisfied. Integrated arrays receive a finite check, but final time/speed/strain arithmetic has no separate result check and is not an all-finite-input measurement guarantee.

## @evidence contracts/development/common.md#meaningful-documentation

Comments give row-major component indexing, world units, exact step-time relation and the zero-step meaning of contacts.
