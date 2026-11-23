# src/index.ts#renderPathStem

## @evidence contracts/development/implementation.md#principled-implementation

The allowed set contains no path separator, so the result is one component on POSIX and Windows, and the remaining hazards are the two names made of legal characters that mean a directory, `.` and `..`, Windows' trailing-dot stripping, its trailing-space stripping being unreachable because no space survives the character mapping, and its reserved device names, each handled by its own rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The sequence render plan and the production project's output naming both derive paths from target ids through this one function, so a frame directory and its video agree on the stem.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The reserved-name list is the Windows device-name contract, a real platform difference, and no target id is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the character mapping, the trailing-character rule and why, the empty-result fallback, the device-name prefix, and that the mapping is not injective.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two regular-expression passes and one split are linear in the target length, and the device-name check is a constant-time set lookup.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call maps one short id, cheaper than caching.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function returns a new string and retains nothing; the device-name set is a fixed module constant.
