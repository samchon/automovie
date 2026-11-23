# src/planGuidePassOutputs.ts#planGuidePassOutputs

## @evidence contracts/development/implementation.md#principled-implementation

Each output's first, last and pattern paths come from the same naming functions the capture writer uses, so the plan addresses exactly the files a capture of `frameCount` frames writes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validation of passes is delegated to `normalizeGuidePasses` and naming to `guidePassFrameName` and `guidePassFramePattern`; this function only checks the frame count and joins paths.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No pass, directory or frame count is special-cased, and an invalid count throws instead of being clamped.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the pass normalization and its refusals, the empty-request result, the frame-count refusal, and the fixed extension and padding.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is O(P) for P requested names plus three short strings per distinct pass, at most six.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call plans one frame directory from its own arguments, and the strings are cheaper to rebuild than to cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function retains nothing after returning the plan its caller owns and opens no handle or task.
