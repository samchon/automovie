# src/lexicon/HumanLanceCouchClear.ts#HumanLanceCouchClear
## @evidence contracts/development/common.md#meaningful-documentation

States the three points tested and the clearance they keep.

## @evidence contracts/development/implementation.md#principled-implementation

The grip, the middle of the forearm and the elbow are each kept `CLEAR` from the horse's shapes by their least signed distance: exact for a sphere, a capsule and a box, and from a hull's bounding sphere about its centroid, which never reads a hull nearer than it is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `HumanLanceCouch` as the clearance test both carriage searches use.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

`CLEAR` is half a hand's thickness with the skin and is marked provisional; the hull bound errs toward clear, never toward contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three points against each shape: linear in the horse's shape count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanLanceCouchClear.ts#HumanLanceCouchClear.IHorseBody

## @evidence contracts/development/common.md#meaningful-documentation

States the shapes' frame and the seat point.

## @evidence contracts/development/design.md#principled-representation

The horse's rest shapes in its model frame and the seat point there, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by the lance couch and read by `HumanLanceCouchClear`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
