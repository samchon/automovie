# src/physics/IAutoMovieProjectileDragInterval.ts#IAutoMovieProjectileDragInterval

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its knot time or endpoint-state meaning.

## @evidence contracts/development/design.md#principled-representation

Two actual integrator knot times and their position/velocity states define the position cubic, whose endpoint derivatives are those velocities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The drag departure classifier needs the dense curve's endpoints, not a continuous-force assumption or a second integration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No resampled trajectory or mutable knot storage escapes; state readers return fresh numeric records.
