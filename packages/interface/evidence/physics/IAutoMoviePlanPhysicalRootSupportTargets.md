# src/physics/IAutoMoviePlanPhysicalRootSupportTargets.ts#IAutoMoviePlanPhysicalRootSupportTargets

## @evidence contracts/development/design.md#principled-representation

Rebase authored world poses to the actual root and fit eligible chains back toward their original world support points.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planPhysicalRootSupportTargets reads the body's supportTracking policy and leaves balance-owned joint chains to their existing task.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Overlapping or shorter-than-two-bone chains are excluded, and root lowering is disabled; no eligible chain or zero iterations returns the original target record unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

States actual-root rebasing and exclusion of coordinates already owned by balance.

# src/physics/IAutoMoviePlanPhysicalRootSupportTargets.ts#IAutoMoviePlanPhysicalRootSupportTargets.IInput

## @evidence contracts/development/common.md#meaningful-documentation

States actual-root rebasing and exclusion of coordinates already owned by balance.

## @evidence contracts/development/design.md#principled-representation

Canonical body policy and world transforms define a support correction; excluded is a bone identity set, not a second pose source.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planPhysicalRootSupportTargets reads the body's supportTracking policy and leaves balance-owned joint chains to their existing task.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only disjoint endpoint chains are fitted; actual root placement is the anchor and cannot be replaced by an authored virtual stance.
