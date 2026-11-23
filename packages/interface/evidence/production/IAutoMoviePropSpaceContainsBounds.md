# src/production/IAutoMoviePropSpaceContainsBounds.ts#IAutoMoviePropSpaceContainsBounds.IProps

## @evidence contracts/development/design.md#principled-representation

bounds corners are in world metres and each is tested against the union of declared subtree volumes. Corner inclusion does not prove full inclusion in a nonconvex union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

propSpaceContainsBounds is shared by prop-placement and service-network in-space gates; the environment owns logical space membership and volume declarations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unknown space throws, while a subtree with no stated volume accepts every box because it supplies no geometric restriction.

## @evidence contracts/development/common.md#meaningful-documentation

Corner-containment query for a world box and a logical building subtree. bounds corners are in world metres and each is tested against the union of declared subtree volumes. Corner inclusion does not prove full inclusion in a nonconvex union.
