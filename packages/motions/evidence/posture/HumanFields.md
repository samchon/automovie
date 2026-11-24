# src/posture/HumanFields.ts#HumanFields.Unlisted

## @evidence contracts/development/common.md#meaningful-documentation

Names the fields of an interface that a validator's two lists leave unclassified, `never` while the lists are complete.

## @evidence contracts/development/design.md#principled-representation

The interface is the one owner of its fields; the validator's lists are typed as its keys, so the compiler, not a hand transcription, decides completeness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One alias over the interface and the two lists, read by each validator where its sets are built.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No runtime reflection or schema copy: the check exists only in the types.

# src/posture/HumanFields.ts#HumanFields.admitted

## @evidence contracts/development/common.md#meaningful-documentation

States that the admitted fields become a set only when the validator classifies every field of its interface.

## @evidence contracts/development/implementation.md#principled-implementation

The type parameter `Missing` is constrained to `never`, so a validator that passes its unlisted fields fails to compile until it lists the field the interface gained.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One set construction from the admitted list.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No runtime key inspection replaces the compile-time check, and no field is silently admitted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the admitted fields, once per validator at module load.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each validator builds its own set once; nothing repeats.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The set is the validator's constant; nothing else is retained.