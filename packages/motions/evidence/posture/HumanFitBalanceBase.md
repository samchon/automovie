# src/posture/HumanFitBalanceBase.ts#HumanFitBalanceBase.IThrough

## @evidence contracts/development/design.md#principled-representation

The half-plane's kind and its corners' indices, what its signed distance is a function of.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Made by `of`; read by `slopes` and `at`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every half-plane `of` builds names its own corners; none is left fixed while its corners move.

## @evidence contracts/development/common.md#meaningful-documentation

States the three kinds and what `p` and `q` are in each.

# src/posture/HumanFitBalanceBase.ts#HumanFitBalanceBase

## @evidence contracts/development/implementation.md#principled-implementation

Andrew's monotone-chain convex hull of the points' floor projections, then the half-planes that bound it: a polygon's edges, a segment's sides and end caps, or a point's four axis half-planes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One projection, one hull, one half-plane pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No half-plane is dropped or zeroed for a degenerate base.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P log P) for P points, O(H) for H half-planes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The corner mean is computed once for every edge's orientation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh arrays and retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the input, units and result order.

# src/posture/HumanFitBalanceBase.ts#HumanFitBalanceBase.ICorner

## @evidence contracts/development/design.md#principled-representation

The floor coordinates the hull reads and the index that names the bearing point, so a corner is known as the point that rides its bone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Made by `of`, read by `HumanFitBalance.of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The index is the caller's own point order, never a re-derived identity.

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its units.

# src/posture/HumanFitBalanceBase.ts#HumanFitBalanceBase.IPlanes

## @evidence contracts/development/design.md#principled-representation

Three parallel arrays, one entry per half-plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Made by `of`, read by `HumanFitBalance.of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every half-plane has all three entries.

## @evidence contracts/development/common.md#meaningful-documentation

States the three arrays and their shared order.
