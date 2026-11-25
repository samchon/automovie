# src/compose/courseLimbSwivelKnots.ts#courseLimbSwivelKnots.ISwivelKnot

## @evidence contracts/development/common.md#meaningful-documentation

States the members.

## @evidence contracts/development/design.md#principled-representation

The resolver's own seeds at a second: the coursed limbs' a read interpolates, and the other limbs' the next knot continues.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written and read only by `courseLimbSwivels.swivels`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No pose is kept.

# src/compose/courseLimbSwivelKnots.ts#courseLimbSwivelKnots.between

## @evidence contracts/development/common.md#meaningful-documentation

States what each limb takes and why.

## @evidence contracts/development/implementation.md#principled-implementation

The swivel is the one free coordinate of a two-bone limb on its goal. Between two fits on one branch it lies on the minimum-jerk path through its run of knots (Flash and Hogan 1985, J Neurosci 5:1688): the quintic Hermite of the two knots' values, velocities and accelerations (`HumanMinimumJerkSpline.quintic`), those from the path's own continuity equations (`rates`), so the value, velocity and acceleration at a knot equal its limits from either side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One share, one pass over the earlier knot's limbs, each a quintic of the two knots' prepared rates, and one over the later knot's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A limb is never interpolated across a branch change.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the knots' limbs; the rates are prepared once (`rates`).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/courseLimbSwivelKnots.ts#courseLimbSwivelKnots.IRate

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinates and their units.

## @evidence contracts/development/design.md#principled-representation

A via point of the minimum-jerk path: its unwrapped values and their first two derivatives, what the quintic between two knots reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by `rates`, read by `between`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The twist is a coordinate only where the whole run gives one, so no knot's missing twist is filled.

# src/compose/courseLimbSwivelKnots.ts#courseLimbSwivelKnots.Rates

## @evidence contracts/development/common.md#meaningful-documentation

States what it maps and when a limb is absent.

## @evidence contracts/development/design.md#principled-representation

Each limb's via point at one knot, keyed by the limb.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One map per knot, from `rates` to `between`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A limb with no run at a knot is absent, never zero.

# src/compose/courseLimbSwivelKnots.ts#courseLimbSwivelKnots.rates

## @evidence contracts/development/common.md#meaningful-documentation

States the path, its runs, the unwrapping, the twist coordinate and when it is prepared.

## @evidence contracts/development/implementation.md#principled-implementation

Flash and Hogan 1985 (J Neurosci 5:1688): the path minimising the integrated squared jerk through via points is a quintic on each interval with its position, velocity and acceleration (and jerk and snap) continuous at each interior via point and at rest at both ends; the via points' velocities and accelerations are `HumanMinimumJerkSpline.derivatives`, the solution of those continuity equations. Each run of knots that fit a limb on one branch is one such path.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass per limb over the knots, splitting runs at a branch change or a missing fit, one derivative solve per run.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No run spans a branch change; the swivel is unwrapped by each step's shortest turn, the convention the interpolation it replaces used.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the knots times the limbs: the block-tridiagonal solve is linear in a run's length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Its caller prepares it once per course.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh maps and retains nothing.