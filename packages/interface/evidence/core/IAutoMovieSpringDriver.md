# src/core/IAutoMovieSpringDriver.ts#IAutoMovieSpringDriver

## @evidence contracts/development/design.md#principled-representation

stepSpring predicts current + (current - previous) * (1 - drag) + normalize(gravityDir) * gravityPower * dt², pulls stiffness * dt toward rest, projects local bone length and then resolves sphere penetration. Positive finite dt is checked; stiffness * dt is not capped, so a product above one can overshoot and finite authored inputs do not certify finite derived arithmetic.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The driver holds only the per-chain parameters while the cross-frame memory lives in the caller's `IAutoMovieSpringState`, so the record stays plain data and one state can serve every spring in a scene.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Invalid authored parameters refuse and absent state defers the driver. Centre transport is keyed by the centre/ordered-chain tuple, so distinct chains do not consume each other's shared-centre translation; joint history remains keyed by joint id. Collision projection follows length projection and can stretch a segment, and later failure does not roll back prior state writes.

## @evidence contracts/development/common.md#meaningful-documentation

States when the driver steps, the order of the integration terms, units of gravity and radius, the valid ranges, which joints are written and which are not, the center compensation and its limit, and each throwing case.
