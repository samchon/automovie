# src/soft/IAutoMovieSoftNodeTransform.ts#IAutoMovieSoftNodeTransform

## @evidence contracts/development/design.md#principled-representation

World position and orientation lift an authored node-local anchor offset into the resolved boundary at one fixed-step time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The wearable resolver receives only node identity and rigid placement, leaving motion sampling and scene ownership to its caller.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No scale or missing-node default changes the rigid anchor contract; the resolver refuses an absent named frame.

## @evidence contracts/development/common.md#meaningful-documentation

States node identity, world frame and fixed-step provenance for both placement fields.
