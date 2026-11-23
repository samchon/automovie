# src/soft/IAutoMovieSoftAnchorBinding.ts#IAutoMovieSoftAnchorBinding

## @evidence contracts/development/design.md#principled-representation

The wearable boundary sampler rotates a node-local or actor bone-local offset by the supplied world rotation and adds the world position at each fixed-step boundary; no node/bone scale is represented or applied before simulateSoftBodyWithBoundaries receives the resolved target.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminator separates node transforms from humanoid bone transforms without storing a competing static world coordinate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The wearable resolver refuses missing subjects or bones rather than replacing them by rest positions. Static simulateSoftBody currently ignores binding metadata, so its output does not establish that an authored moving owner was followed; scene evaluation owns the supplied transform.

## @evidence contracts/development/common.md#meaningful-documentation

Each arm names its stable owner, local coordinate frame and metre offset; this record is authoring input rather than a resolved world pose.
