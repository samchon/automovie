# src/internal/finiteTuple.ts#finiteTuple

## @evidence contracts/development/implementation.md#principled-implementation

Undefined copies the fixed fallback; supplied arrays must match its length and contain only finite numbers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The tuple gate owns numeric/arity admission while motion-node interpretation chooses translation, scale and quaternion defaults.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Wrong lengths and nonfinite values throw; supplied tuples are not normalized or padded to hide defects.

## @evidence contracts/development/common.md#meaningful-documentation

Comments identify omission, caller-owned copied output and indexed finite-value errors.

## @evidence contracts/development/implementation.md#efficient-algorithms

Tuple length K drives O(K) time and result space; current callers use only three or four components.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same tuple admission serves translation, rotation and scale without cross-call caching of mutable inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned K-number array belongs to its caller and retains no reference to the source or fallback array.
