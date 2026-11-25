# src/reaction/staggerPendulumEntry.ts#staggerPendulumEntry.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, its frames and who shares it.

## @evidence contracts/development/implementation.md#principled-implementation

The pendulum's frequency from Hof's leg length, the centre of mass read from the entry posture, and the soles' extents along the heading's axes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record of every speed-independent quantity the constructor used to read per pendulum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every value is read from the actual body and entry; nothing is a constant of one body.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four centre-of-mass reads (the entry's and the bending's three) and two sole-extent scans per search instead of per probed speed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The record depends on the body and the entry alone, so a search over speeds and pushes on one entry shares it; a different entry prepares its own.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record that its search owns until it returns.

# src/reaction/staggerPendulumEntry.ts#staggerPendulumEntry.PrepareResult

## @evidence contracts/development/common.md#meaningful-documentation

Names the pendulum members the entry geometry fixes.

## @evidence contracts/development/design.md#principled-representation

The keys of `StaggerPendulum` that depend on the body and the entry alone: the frequency, the centre, the root, the heading's axes, the entered feet, the soles' width and length and the trunk's bend.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `staggerPendulumEntry.prepare` and the plans that keep its result.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

A closed union of the class's own keys.
