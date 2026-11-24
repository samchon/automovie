# src/perform/HumanPerformanceSoftBoundary.ts#HumanPerformanceSoftBoundary

## @evidence contracts/development/common.md#meaningful-documentation

States what the sample holds for each kind of anchor and capsule.

## @evidence contracts/development/implementation.md#principled-implementation

Each binding's local offset is carried by its displayed bone or prop frame. A placed span supplies both world endpoints. A gripped particle follows the hand that closed last.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the anchors and one over the body capsules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing bone or prop throws through its reader, and authored node ids cannot be mistaken for temporary grip anchors.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in anchors and capsules, plus a grip scan for each replay-assigned grip particle. Bones are read once per person and step through the reader.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The bone reader holds each person's bones per step, read before the solves (`prepareBones`). The caller supplies both span endpoints from one prop frame and one posed span read at this step.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh sample and retains nothing.

# src/perform/HumanPerformanceSoftBoundary.ts#HumanPerformanceSoftBoundary.prepareBones

## @evidence contracts/development/common.md#meaningful-documentation

States which people and steps are read, when, and why one read serves every replay.

## @evidence contracts/development/implementation.md#principled-implementation

Every step of an anchor's or capsule's person, and each grip window's steps for its hand, are the boundary samples' reads; each is the displayed bones at that step's second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Collect the wanted steps per person, read them, return an index into the table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No read is skipped, approximated or kept beyond the solve that owns it; a step no boundary reads is not read.

## @evidence contracts/development/implementation.md#efficient-algorithms

One displayed-bone read per wanted person and step before the W + 1 replays, instead of one per replay; a read is a table lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The replays share the one table; no memo is filled on read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The table lives as long as the soft solve's closure and is released with it.
