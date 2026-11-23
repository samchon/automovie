# src/scene/applyMaskMode.ts#applyMaskMode

## @evidence contracts/development/implementation.md#principled-implementation

Colors each mesh-bearing top-level subtree by its current child index and uses a distinct override per actual deformation cycle and skinning method; black background and unlit material expose positional coverage, not stable entity identity, and palette repetition limits large-child distinction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns legacy positional mask assignment and reversible material bookkeeping; semantic identity masks have their own explicit palette owner rather than being inferred from scene positions here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Index palette is the documented legacy convention, not a fixture-key branch; all collected meshes use actual source/cycle identity and no foreign method is replaced or existing material disposed.

## @evidence contracts/development/common.md#meaningful-documentation

States positional versus semantic identity, black background and restore ownership; cycle- and skinning-method-specific sharing preserves animated and dual-quaternion vertex behavior without changing the child's assigned color.

## @evidence contracts/development/implementation.md#efficient-algorithms

Collects meshes in each top-level subtree and assigns O(M) references with one material per subtree/cycle/skinning-method identity; temporary originals are O(M), materials O(C), and no material is allocated for an empty subtree.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares a material among meshes under the same child, exact cycle identity and skinning method, because child color, cycle uniforms and the skinning patch jointly determine equivalence; different children/pass installs keep independent colors/restoration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows original materials/background and owns temporary override materials until memoized restore, which independently restores references and disposes all overrides; construction failure partway through assignment has no outer rollback here.
