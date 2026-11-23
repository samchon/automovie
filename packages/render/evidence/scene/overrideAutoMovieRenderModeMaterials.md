# src/scene/overrideAutoMovieRenderModeMaterials.ts#overrideAutoMovieRenderModeMaterials

## @evidence contracts/development/implementation.md#principled-implementation

Collects actual render-mode meshes, skips those an optional `keep` names, so the graphics pass leaves its surface graphics as beauty draws them, hands each factory call the original it replaces (a material or a material group, so a pass such as albedo can read its base colour), records originals and every returned owned override, one per group slot, before cycle and dual-quaternion skinning patching, then independently restores all swaps and retires distinct overrides on setup/refinalization failure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One setup owner keeps material swaps distinct from formation-cycle and skinning shader patching and uses the existing restoration policy plus sticky once guard.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Current factories must return caller-transferred owned overrides, not borrowed source materials; partial setup never silently leaves earlier meshes overridden and repeated failed restoration does not retry disposal.

## @evidence contracts/development/common.md#meaningful-documentation

Documentation explains the factory's original-material argument and group result, the kept meshes, fresh override ownership, original-material restoration, animated-cycle and dual-quaternion skinning inheritance and failure-safe teardown without claiming guide appearance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Collection/setup scans N scene nodes and M meshes; restoration visits M swaps plus U distinct overrides with O(M+U) retained references, while actual shader patching remains with the cycle and skinning owners.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Material identity deduplicates retirement within the pass and repeated restore shares its original outcome; another pass creates its own material effects rather than reusing a failed override.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Every override registers before later setup can throw and independent restoration attempts all owners. A failed callback retains originals/overrides/cause under the weak scene key even when setup returns no handle; existing pass admission refuses reacquisition without disposal retry.
