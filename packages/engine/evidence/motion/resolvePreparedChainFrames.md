# src/motion/resolvePreparedChainFrames.ts#resolvePreparedChainFrames

## @evidence contracts/development/implementation.md#principled-implementation

Every chain record is converted in authored order, including overwritten duplicates, and the last quaternion wins as in full FK. The shared two-joint prefix gives the mid frame, then captured fixed transforms and the admitted end articulation give the effector frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared private reader owns authored-order admission and the lower prefix. This complete-frame entry adds the effector frame; its lower companion uses the identical admission reader without unused world-effector assembly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An invalid earlier chain duplicate still throws before a later record can overwrite it. Unchanged non-chain records were admitted during preparation. Missing articulations remain identity without admitting an unused basis, and no ideal target substitutes for actual FK.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(J) joint scan and one conversion per chain record, normally three, replace a full skeleton walk; duplicate admission is required and conversions are not repeated. The lower-only companion skips two final effector quaternion products, a vector rotation and an addition, while retaining every end conversion; runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both frames share one completed lower prefix and admitted quaternions; an optional matching rig lends each chain bone's prepared composer (`prepareChainFit.IRig.composer`), the same expressions, so every read of a fit composes its records with one composer a bone, without skipping any authored record. Fixed transforms and mappings belong to this fit's unchanged source, never a global body cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns only two returned frames and temporary quaternions; retains no pose, prepared record, history, process or resource handle after return.

## @evidence contracts/development/common.md#meaningful-documentation

States frame, unchanged dependencies, clinical mapping and last-joint precedence, and distinguishes the two returned frames.
