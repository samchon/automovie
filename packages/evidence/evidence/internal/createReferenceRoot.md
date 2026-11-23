# src/internal/createReferenceRoot.ts#createReferenceRoot

## @evidence contracts/development/implementation.md#principled-implementation `path.relative` between two absolute directories gives the path native Evidence resolves back against the configuration directory; replacing `\` with `/` keeps Windows output portable. Directories on different Windows drives have no relative path, and Node then returns the absolute target, which passes through unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the location-to-root rule for the engineering defaults and both story contract owners, instead of repeating the relative-and-normalize steps at each reference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No root is special-cased; an empty relative path becomes `.` because an empty root names no directory.

## @evidence contracts/development/implementation.md#efficient-algorithms

One relative-path computation and one replacement, linear in the path lengths.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure path computation coordinates no work across requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned string outlives the call.

## @evidence contracts/development/common.md#meaningful-documentation

States how native Evidence resolves the result, the portable separators, the parameters and the `.` result.
