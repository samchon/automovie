# src/schema/IAutoMovieHumanSpinePoseSchema.ts#IAutoMovieHumanSpinePoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration separates the thoracic and lumbar blocks, describes their units and identifies where each region's flexion, side bend and rotation are authored.

## @evidence contracts/development/design.md#principled-representation

The two optional child schemas keep their own numerical bounds. Human maps the thoracic channels to the chest joint and the lumbar channels to the spine joint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The top-level pose owns the spinal block. Neck and pelvis controls retain their separate clinical records.
