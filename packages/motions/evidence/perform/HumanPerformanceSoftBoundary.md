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

The bone reader keeps each person's bones per step. The caller supplies both span endpoints from one prop frame and one posed span read at this step.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh sample and retains nothing.
