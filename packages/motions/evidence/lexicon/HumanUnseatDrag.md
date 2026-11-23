# src/lexicon/HumanUnseatDrag.ts#HumanUnseatDrag.IDrag

## @evidence contracts/development/common.md#meaningful-documentation

The law's context, carrier, seated sampler, release, stirrup, side, breakaway, lie, the fitted lie, its root height and the window builder.

## @evidence contracts/development/design.md#principled-representation

The plan's shared state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `drag`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanUnseatDrag.ts#HumanUnseatDrag.drag

## @evidence contracts/development/common.md#meaningful-documentation

States the drag, its release and its windows.

## @evidence contracts/development/implementation.md#principled-implementation

The lying root a leg's length behind the stirrup along the carrier's level heading, the foot's goal the stirrup's own point; after the breakaway the root slides with the velocity it had (`HumanUnseatFlight`).

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

Windows, then the sampler.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The stirrup is read where the carrier has it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One stirrup and one carrier reading per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The breakaway slide is solved once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains the carrier reader.
