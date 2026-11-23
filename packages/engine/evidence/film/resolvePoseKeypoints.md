# src/film/resolvePoseKeypoints.ts#resolvePoseKeypoints

## @evidence contracts/development/implementation.md#principled-implementation

Composes default engine FK, column-major T·R·S placement, sampled camera and shared cropped pinhole projection; renderer coincidence requires matching joint-axis/rest-frame conventions because no remap enters this function. NDC maps to top-left coordinates by x=(ndcX+1)/2 and y=(1-ndcY)/2, without pixel observation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure projection per actor and instant; camera sampling, projection and the joint set are reused from their owners, and the render package's keypoint plan drives it per frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bone or rig is special-cased; out-of-frame joints are reported with a flag instead of being clamped or dropped, and the default aspect is the documented assumption for a camera that states none.

## @evidence contracts/development/common.md#meaningful-documentation

States the pipeline from pose to frame, the coordinate frame and range, the out-of-frame rule and why nothing is clamped, the missing-joint rule, the order, and each option's default.

## @evidence contracts/development/implementation.md#efficient-algorithms

Delegates forward kinematics to resolvePose and track sampling to resolveCameraAt, evaluating world transforms only on requested ancestor paths, then builds one requested-position map and node matrix and projects J requested joints. Total cost includes both delegated traversals rather than only the local O(B + J) indexing/projection work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Projects one actor at one instant per call; the keypoint plan calls it per performing actor per frame, and the inputs carry no identity to key a cache on.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The bone index and node matrix are released on return; the returned keypoints are fresh records owned by the caller.
