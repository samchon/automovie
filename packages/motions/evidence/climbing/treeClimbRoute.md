# src/climbing/treeClimbRoute.ts#treeClimbRoute.IHold

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The body part, how it touches, the point's name, world point and outward normal, and the branch and distance it loads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a stance and the load check read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by the route.

# src/climbing/treeClimbRoute.ts#treeClimbRoute.ILoad

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The branch index and the distance from its root.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the load check reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by the route.

# src/climbing/treeClimbRoute.ts#treeClimbRoute.IRoute

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The support stances and the staged holds by name.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What planTreeClimb hands the support law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by expand.

# src/climbing/treeClimbRoute.ts#treeClimbRoute.IStance

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The holds, the event and the preferred pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the support plan is built from.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by the route.

# src/climbing/treeClimbRoute.ts#treeClimbRoute.up

## @evidence contracts/development/common.md#meaningful-documentation

States the route and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Hand and foot points on the branches and the bole, sided so the right hand takes the hold on the climber's right.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The ground phase, then one block per branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A branch out of reach refuses with its height; the distances are provisional and stated as such.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the branches climbed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/climbing/treeClimbRoute.ts#treeClimbRoute.sit

## @evidence contracts/development/common.md#meaningful-documentation

States the two stances and their holds.

## @evidence contracts/development/implementation.md#principled-implementation

The standing hands' holds carry the body while the feet leave; the seat then bears on the published seat point, the legs hung by the astride pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two stances from the standing one.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The legs hang by the preferred pose, with no hold.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
