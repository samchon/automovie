# src/index.ts#applyAutoMovieRigLocals

## @evidence contracts/development/implementation.md#principled-implementation

Validates the complete slot set and finite metric TR values before writing, preserves evaluator-provided translations and x-y-z-w unit quaternions, enforces unit rig scale, refreshes Three local/world matrices and invalidates the existing skin cache owner. Parent-frame locals must describe the target's actual hierarchy; the adapter does not retarget rigs or infer missing joints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One adapter copies a generator-independent structural contract into a borrowed built/imported graph; pose mathematics, morph drivers and imported runtime hooks remain with their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every mapped bone takes the same path; missing slots and invalid rotations refuse before mutation instead of retaining stale bones or normalizing malformed data, and culling remains enabled.

## @evidence contracts/development/common.md#meaningful-documentation

Gives absolute local/root frames, units, tuple order, completeness, unit-scale policy, numerical tolerance, atomic validation, matrix/cache effects and caller-owned work.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two O(B) map scans validate and write B mapped bones, followed by O(A+O) ancestor/subtree matrix work and O(O) skin invalidation for A ancestors and O model objects; no per-vertex deformation, per-bone temporary objects or retained arrays are allocated.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses existing Three bones, matrices and skin caches; each call rewrites the supplied pose because map identity does not prove mutable tuple contents unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the target/map/root only until return and creates no retained state, GPU allocation, timer or task; skin invalidation releases stale bounds through its owner.
