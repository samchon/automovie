# src/lexicon/HumanMountedHandoffs.ts#HumanMountedHandoffs

## @evidence contracts/development/common.md#meaningful-documentation

States which limbs are handed off and why.

## @evidence contracts/development/implementation.md#principled-implementation

A limb a goal moves at one end of a transfer and its joints at the other has that end fitted once (`resolveHumanPosture`) and its chain's joints read from the fit (`HumanLimbFit.chain`), so the transfer blends joints to joints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cut out of `HumanMounted`'s plan as the transfers' hand-offs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the fit is the resolver's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one fit per transfer end, shared by the limbs handed off there.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each end's fit is shared by its limbs within the transfer.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the plan keeps the result.
