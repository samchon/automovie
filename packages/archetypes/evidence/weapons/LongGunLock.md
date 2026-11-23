# src/weapons/LongGunLock.ts#LongGunLock.swell

## @evidence contracts/development/common.md#meaningful-documentation

States where the hand goes, the drill that puts it there and where the place comes from.

## @evidence contracts/development/implementation.md#principled-implementation

The swell at the rearmost of the pipes laid along the fore-end, the ramrod's entry into the stock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression over the pipes' spacing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The pipes' places are `ESTIMATES.rod`'s, and so the swell's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per musket.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/weapons/LongGunLock.ts#LongGunLock.musket

## @evidence contracts/development/common.md#meaningful-documentation

States each part's place and each articulation's sense.

## @evidence contracts/development/implementation.md#principled-implementation

The ramrod is the barrel's length, so rammed home its tip reaches the breech, and its travel takes its tail out of the front pipe, so a fully drawn rod is free; the lock is the shared flintlock at the breech.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The lock, the rod and its pipes, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The pipes' places and the rod's setback are `ESTIMATES.rod`'s.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

About ten parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one lock.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/weapons/LongGunLock.ts#LongGunLock.bolt

## @evidence contracts/development/common.md#meaningful-documentation

States the two motions and the magazine's opening.

## @evidence contracts/development/implementation.md#principled-implementation

The handle stands out on the right at the breech; the lift turns it up about the bore's axis, and the slide, riding the lift, draws bolt and handle back along the bore.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bolt and handle, then the three contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The lift, the stroke and the handle's reach are `ESTIMATES.bolt`'s; the cocking piece and the extractor are not modelled.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one bolt.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/weapons/LongGunLock.ts#LongGunLock.lever

## @evidence contracts/development/common.md#meaningful-documentation

States the two hinges and their coupling.

## @evidence contracts/development/implementation.md#principled-implementation

One leader and one follower by a ratio, the hammer reaching full cock at the lever's full swing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Lever and hammer, then the two contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The swing, the fall and the loop are `ESTIMATES.lever`'s; the carrier and the tube magazine's gate are not modelled.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one action.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
