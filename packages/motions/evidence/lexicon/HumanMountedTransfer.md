# src/lexicon/HumanMountedTransfer.ts#HumanMountedTransfer

## @evidence contracts/development/common.md#meaningful-documentation

States the four shapings of a transfer and that the ends are left as blended.

## @evidence contracts/development/implementation.md#principled-implementation

Each limb end's turn is slerped by the transfer's share, a foot kept on its rest turned about its ball; each handed-off limb's joints are blended linearly by the share; the hips swing between the keys about the stirrup feet (`HumanMountedPaths.swing`, `pivot`); a leg rises over the carrier on its arc by `4 s (1 - s)`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cut out of `HumanMounted`'s sampler as the transfer's shaping; the sampler then carries and leans the posture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: every shaping is read from the keys and their prepared paths.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per limb per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reshapes the one blend it is given.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
