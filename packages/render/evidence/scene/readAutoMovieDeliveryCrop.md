# src/index.ts#readAutoMovieDeliveryCrop

## @evidence contracts/development/implementation.md#principled-implementation

Divides the enabled Three view's offset/extent by its full dimensions, then validates the resulting normalized window through the engine resolver. Positive finite native full dimensions remain a caller premise; raw native fields are not independently admitted when their ratios form a valid window.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the camera's realized projection state instead of retaining a second crop register, so formation/instance culling consumes the same window as projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Disabled and exactly whole views map to omission by the crop contract; no scene-id exceptions, approximate edge snapping or foreign method replacement occurs.

## @evidence contracts/development/common.md#meaningful-documentation

Gives downstream culling/LOD purpose, disabled/whole-window meaning and the native-view premise; invalid normalized ratios refuse without repairing their source fields.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads one fixed-size view record and computes four normalized edges with constant time and temporary storage, independent of scene or raster dimensions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the existing camera view directly on each request because mutable offsets/full dimensions can change; no duplicated crop cache or invalidation protocol is introduced.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the camera and returns a small portable crop value or omission; retains no camera/GPU handle and launches no task.
