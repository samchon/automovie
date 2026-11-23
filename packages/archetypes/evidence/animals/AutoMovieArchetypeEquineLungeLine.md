# src/animals/AutoMovieArchetypeEquineLungeLine.ts#AutoMovieArchetypeEquineLungeLine.IHand

## @evidence contracts/development/common.md#meaningful-documentation

Metres: up from the floor, out toward the equid and aside toward the rein's side.

## @evidence contracts/development/design.md#principled-representation

Three distances.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `layer` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineLungeLine.ts#AutoMovieArchetypeEquineLungeLine.IChange

## @evidence contracts/development/common.md#meaningful-documentation

Film seconds; three phases of equal seconds: in to the middle, held there while the other hand takes it, out to the other side.

## @evidence contracts/development/design.md#principled-representation

A start and a phase length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `layer` reads; the handler's law changes hands on the same clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineLungeLine.ts#AutoMovieArchetypeEquineLungeLine.layer

## @evidence contracts/development/common.md#meaningful-documentation

States the frame the hand is read in.

## @evidence contracts/development/implementation.md#principled-implementation

The hand stands out from the centre toward the equid's root, aside toward the line hand's side and up by its height; across a change it comes in to the middle over one phase on a minimum-jerk share, stays there through the second while the other hand takes it, and goes out to the other side over the third; the line runs from there to the halter.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One held point per sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One placement read per sample beyond the layer's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `EquineLine`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the ride and the hand.
