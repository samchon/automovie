# src/schema/IAutoMovieHumanNeckPoseSchema.ts#IAutoMovieHumanNeckPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies all three pieces and their common degree reference. Each optional block names the joint motion it owns.

## @evidence contracts/development/design.md#principled-representation

The three child schemas preserve existing ranges. Human's channel table places skull-to-atlas motion on the head joint, atlas rotation on the atlas and lower cervical motion on the neck.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pose groups only neck joint motion here. Gaze and jaw movement use the separate head block, and the reader obtains each nested channel from its defining record.
