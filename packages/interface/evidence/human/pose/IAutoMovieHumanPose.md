# src/human/pose/IAutoMovieHumanPose.ts#IAutoMovieHumanPose

## @evidence contracts/development/common.md#meaningful-documentation

A static pose of one person: every anatomically movable joint, top to bottom, each degree of freedom one optional number in clinical units.

## @evidence contracts/development/design.md#principled-representation `head`: Eyes and jaw. `neck`: Cranio-vertebral joints and the lower cervical spine. `arms`: Shoulder girdle, arm and hand of each side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanRigControls.blend. Read by AutoMovieHumanRigControls.bounds, AutoMovieHumanRigControls.readApplied, AutoMovieHumanRigControls.blend. Also types AutoMovieHumanRigControls.pose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `head`: Eyes and jaw. `neck`: Cranio-vertebral joints and the lower cervical spine. `arms`: Shoulder girdle, arm and hand of each side. `spine`: Thoracic and lumbar spine. `pelvis`: Orientation of the pelvis, the root of the body. `legs`: Hip, knee, ankle, foot and toes of each side.
