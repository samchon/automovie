# src/sport/createPuttingGreen.ts#createPuttingGreen

## @evidence contracts/development/implementation.md#principled-implementation

The R&A and USGA Rules of Golf define the hole as 4.25 in (108 mm) across and at least 4 in (101.6 mm) deep. The green's side is a provisional practice-green size.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the side, build the sectors and the cup bottom, then record the two affordances.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The cup wall is a 16-sided polygon inscribed in the rule's circle; the turf is flat, with no slope, grain or speed of its own.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed number of parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the open cup, the sector construction and the affordances.
