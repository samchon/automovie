# src/kinematics/resolveAutoMovieBoneRates.ts#resolveAutoMovieBoneRates

## @evidence contracts/development/implementation.md#principled-implementation

Differentiates p_child=p_parent+R_parent*r_fixed and R_child=R_parent*R_local: v_child=v_parent+omega_parent cross (p_child-p_parent), omega_child=omega_parent+R_child*omega_local_body. Actual resolved positions/rotations provide the same frames as native FK, whose fixed rests and ignored scales are explicit premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One parent-first traversal uses the existing topology and resolved records; the local derivative producer and centroidal reducer retain their own responsibilities. Finite admission and completeness gate the entire returned map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No missing local rate becomes zero, no finite difference or guessed clinical derivative is synthesized, and no bone, fixture, tolerance, scaling rule or root default is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits each supplied ancestor-complete bone once and checks its children and root siblings in the existing topology, skipping absent subtrees. Work is O(T) for T rig bones in the worst case, fresh map/vector storage is O(B) for B supplied bones, and call stack is O(D) for hierarchy depth; no FK pose is recomputed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One pure instantaneous propagation coordinates no repeated requests and retains no cross-call state; its supplied topology belongs to the caller's unchanged rig epoch.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The call owns one O(B) result map and O(D) traversal stack. On unavailable data the temporary result is discarded; on success ownership transfers to the caller. No input, output, handle, task or history is retained.

## @evidence contracts/development/common.md#meaningful-documentation

States native-FK provenance, unchanged-rig and complete-ancestor requirements, local body-frame radian rates, common-frame metre velocities, explicit-zero versus missing semantics, scale/offset limits, fallback and fresh ownership.
