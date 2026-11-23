# src/props/createHoseLine.ts#createHoseLine

## @evidence contracts/development/implementation.md#principled-implementation

A hose run on a bend at the operator's hold, a lead and a nozzle, a bail on a hinge, and one grip per team member along the line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Record the size, lay the hose, nozzle and bail, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The hose is two rigid straight runs either side of one bend at the operator's hold; its sag and other kinks are not modelled. Every figure but the bore is a named estimate.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Five parts and seven contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no inputs.

## @evidence contracts/development/common.md#meaningful-documentation

States the trade size, the frame and each contact.
