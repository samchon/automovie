# src/analysis/IAutoMovieSolidBlockQuery.ts#IAutoMovieSolidBlockQuery.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Whether a ray from `origin` along a unit `direction` is stopped by one convex solid before `maxDistance`. Member documentation states the supplied records, units and absence meanings used by autoMovieSolidBlocks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shared half-space representation admits differently scaled normals; autoMovieSolidBlocks applies its relative parallel threshold, while unit direction and valid solid planes remain caller premises.

## @evidence contracts/development/design.md#principled-representation

origin uses world metres and a unit direction makes maxDistance a metre bound; planes express dot(normal, point) <= offset in the same frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieSolidBlockQuery.IProps, used by autoMovieSolidBlocks. Its origin, direction, planes, maxDistance members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
