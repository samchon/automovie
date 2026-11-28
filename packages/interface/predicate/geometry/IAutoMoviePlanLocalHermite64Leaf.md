# src/geometry/IAutoMoviePlanLocalHermite64Leaf.ts#IAutoMoviePlanLocalHermite64Leaf

## @evidence contracts/development/common.md#meaningful-documentation

The declaration describes retained regional bounds and the inherited millimetre coefficient grid. The bound and patch fields provide the error criterion and original cell identity.

## @evidence contracts/development/design.md#principled-representation

The planner restricts the shared Cell grid as it splits a region and keeps leaves after evaluating their bound against tolerance. The t coordinates address the current physical station interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The leaf composes the existing field cell and a named restriction. The restriction owns its longitudinal bounds, error and original patch designation.

# src/geometry/IAutoMoviePlanLocalHermite64Leaf.ts#IAutoMoviePlanLocalHermite64Leaf.IRestriction.t0

## @evidence contracts/development/common.md#meaningful-documentation

The lower phase is normalized and documents its interpolation into physical station coordinates.

# src/geometry/IAutoMoviePlanLocalHermite64Leaf.ts#IAutoMoviePlanLocalHermite64Leaf.IRestriction.t1

## @evidence contracts/development/common.md#meaningful-documentation

The upper phase is normalized, strictly above t0 and no greater than one.

# src/geometry/IAutoMoviePlanLocalHermite64Leaf.ts#IAutoMoviePlanLocalHermite64Leaf.IRestriction.error

## @evidence contracts/development/common.md#meaningful-documentation

The property states the analytic derivative-control bound and its millimetre unit. It identifies zero as a pending-work placeholder and the tolerance comparison as a retained-leaf condition.

# src/geometry/IAutoMoviePlanLocalHermite64Leaf.ts#IAutoMoviePlanLocalHermite64Leaf.IRestriction.patch

## @evidence contracts/development/common.md#meaningful-documentation

The patch distinguishes the original run, interval and root-cell ordinals. A descendant retains the identifier and differs through its own bounds.

# src/geometry/IAutoMoviePlanLocalHermite64Leaf.ts#IAutoMoviePlanLocalHermite64Leaf.IRestriction

## @evidence contracts/development/common.md#meaningful-documentation

The restriction documents normalized longitudinal bounds, the millimetre derivative bound and original patch identity.

## @evidence contracts/development/design.md#principled-representation

The planner splits the longitudinal region of a borrowed field cell and attaches its analytic error measurement. A child retains its root patch ID.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The restriction carries only the four adaptive planning values. The borrowed Cell contract owns the sampled field bounds and Bernstein grid.
