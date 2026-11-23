# src/touch/touchRegion.ts#touchRegion.reader

## @evidence contracts/development/common.md#meaningful-documentation

States each input, which bones each region is read on, what the site moves and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A limb is solved after the trunk, so a leg's region under a lean is read on the legs alone re-solved on the posture so far; the site is fixed once, at plan time, against the first arm's shoulder at the entry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One site, one shoulder, one closure over them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The other hand's region is never moved by the first hand's site.

## @evidence contracts/development/implementation.md#efficient-algorithms

A region assigned to a stationary entry limb places its frame and site once. A leg's region under a lean still needs a current leg resolve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The authored entry and presented arm supply fixed limb frames. Trunk, moving leg and arbitrary target observations still go through their current readers with optional current ROM and FK.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan reader closes over entry bones, shoulder, fixed site and at most one selected-bone set and genuine fixed-demand producer; borrowed ROM/FK remain within the current query until return or throw, and only the actual frame escapes.

# src/touch/touchRegion.ts#touchRegion.disc

## @evidence contracts/development/common.md#meaningful-documentation

States the three sources of the radius in their order and when there is none.

## @evidence contracts/development/implementation.md#principled-implementation

A site's own radius bounds where the hand lands about it; without one the region's own extent on its body does, read from the body's surface table.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Four guarded returns, one per source.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No radius is invented for a prop or a point.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The radius is the surface table's, read and not restated.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
