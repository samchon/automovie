# src/formationGroundRelief.ts#formationGroundRelief

## @evidence contracts/development/implementation.md#principled-implementation

Relief is the difference of two first-containing-surface heights from `worldGroundHeight`, the same ground law the source oracle and the ground gate use, and it relies on the record not being mutated after placement because the datum is remembered per object.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One public function owning the relief rule, with the anchor datum lookup and its weak cache kept private beside it because only relief needs that datum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The three zero cases are the authored absence of terrain under the unit, the member or the anchor, not a catch for failed lookups, and no surface or formation is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, why relief keeps `anchor.y`'s meaning, the three zero cases, and the immutability rule the per-record cache imposes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each call costs one `worldGroundHeight` scan over the record's terrain snapshot, linear in its surfaces and their footprint vertices, for the member; the anchor's scan runs once per record instead of once per member, so placing `n` members costs `n + 1` lookups rather than `2n`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the anchor's ground height across every member placed from one record object; equivalence holds because the datum depends only on that record's `anchor` and `ground`, which the documented contract forbids changing after placement, and there is no other invalidation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module-level `WeakMap` holds one boxed height per live formation record object and releases it when the record is collected, so the retained population is bounded by the records the caller still holds.
