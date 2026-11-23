# src/index.ts#observeRecoveryCameraSet

## @evidence contracts/development/implementation.md#principled-implementation

Existing Harris/descriptor and strict ratio/mutual matcher semantics remain unchanged. Actual aggregate directed comparisons are checked before the first pair traversal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same bounded acquisition phase serves exact-three-view maps and variable-view scenes; their admission, geometry and terminal semantics remain with their operations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No changed ratio, learned features, source/truth lookup, camera-order prior or partial old match cache supplies observations.

## @evidence contracts/development/common.md#meaningful-documentation

States once-per-chart extraction, ordered unordered-pair traversal, both matching directions and aggregate versus pair work limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

N detections retain their admitted pixel/candidate cost; exhaustive matches cost O(128*sum(2FiFj)) with safe aggregate admission before comparison. Retained pair records are bounded by N and per-image feature ceilings.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every pair reuses the same once-observed features, and both map owners consume these results without redetection or rematching.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only call-owned features and index matches return to the enclosing operation; pyramids expire per extraction and no global cache, pixel copy or external handle remains.
