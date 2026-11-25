# src/production/IAutoMovieResolvePoseKeypoints.ts#IAutoMovieResolvePoseKeypoints.IProps

## @evidence contracts/development/design.md#principled-representation

Pose FK uses rig metres and default axes/rest frames, then node TRS places joints in world space. Output coordinates use cropped normalized frame space; camera time is shot-local seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolvePoseKeypoints owns numerical pose conditioning and delegates FK/camera projection to engine owners; the caller supplies the already sampled actor pose independently of camera time.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing requested bones are omitted, off-frame points remain unclamped, and an empty joints list produces no keypoints. Pose/camera failures propagate rather than yielding substitute joints.

## @evidence contracts/development/common.md#meaningful-documentation

Pose, world placement and lens inputs for normalized joint projection. Pose FK uses rig metres and default axes/rest frames, then node TRS places joints in world space. Output coordinates use cropped normalized frame space; camera time is shot-local seconds.
