# src/everyday/IArmPhraseArm.ts#IArmPhraseArm

## @evidence contracts/development/common.md#meaningful-documentation

Documents each member: the side, the hand's origin, the working point's place and offsets in world metres, the target builder and the transport distances.

## @evidence contracts/development/design.md#principled-representation

One arm's geometry for the length of a phrase, in world metres; the target builder turns any point into the arm's target for that working point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Moved from `armPhrase`, its only consumer, which builds one per arm and reads it through the phrase.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member; a visit or an oscillation states a zero start offset.
