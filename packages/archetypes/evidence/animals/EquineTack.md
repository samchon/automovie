# src/animals/EquineTack.ts#EquineTack

## @evidence contracts/development/common.md#meaningful-documentation

States what each tack lays, in which order, and what mass it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Each tack's owner lays its parts; the mass is that owner's read weight, every unread part being massless.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per tack, kept apart from `createHorse` so the producer stays within its size; the existing tacks lay their parts in their original order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tack lays another's parts except the postilion's harness under the saddle and the shared lead and reins.

## @evidence contracts/development/implementation.md#efficient-algorithms

One owner call or two per tack.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The lead and the reins are each laid by their one owner.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
