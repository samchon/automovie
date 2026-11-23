# src/kinematics/preparePoseResolution.ts#preparePoseResolution

## @evidence contracts/development/implementation.md#principled-implementation

Normalize the current actual axes with undefined-only defaults, then always perform original current clinical/frame admission before sharing exact-angle factors on that admitted basis. Raw bone calls delegate directly to resolvePoseBone, preserving rest rotation, Hamilton products, rest translation, vector arithmetic and final bone-name read order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

resolvePose owns traversal, mutable OnBasis owns current clinical/frame reads and resolvePoseBone owns raw composition. Immutable rigs own sparse rows under this key. The reader's private fields hold its original callables, so isNative recognizes original factory readers by a brand check without invoking or trusting their methods.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No raw joint name, clinical/frame tuple or transform is sampled to create a cache key. Null coordinates keep unused sign/neutral bypass; used coordinates retain finite/frame failure order. Every overwritten authored record remains visited, raw bones retain original reads and no caller flag, target or time certifies equivalence.

## @evidence contracts/development/implementation.md#efficient-algorithms

Raw joints keep original admission and share pure factors; raw bones retain their full composition. Immutable-rig clients independently retain sparse dependency reuse. isNative costs one brand check and, only for a factory reader, two own-descriptor reads/temporary descriptors; no rig/input scan or numerical callback runs. A reader costs one object with three private slots, sharing one joint method of the class instead of a closure of its own, and its basis map only at its first joint read, no weak-registry entry (a limb fit makes several: 87 ms self of a 3.6 s standing-resolve profile was these constructions with their closures). Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Basis identity selects pure arithmetic, never mutable frame validity. All current reads remain live. isNative proves only actual factory identity and unchanged own-data joint/bone callables; proxy/wrapped/foreign keys miss before metadata access. It certifies no source admission, pose or solve, and consumers still own their separate source proof.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Weak basis keys own bounded factor workspaces until operation release. The reader's two private fields retain its own original callables and go with it. No raw input, result history or handle is stored; immutable rigs separately own weak-keyed dynamic rows.

## @evidence contracts/development/common.md#meaningful-documentation

Defines raw ordered admission/fresh outputs, pure basis work and immutable-rig operation identity. isNative below states actual factory provenance, unchanged own-data callable checks, no foreign metadata observation and its limited non-admission meaning.
