# src/architecture/createValve.ts#createValve

## @evidence contracts/development/implementation.md#principled-implementation

One read valve whole: its handwheel's diameter and its height open above the pipe's axis as the sheet gives them; the pipe at its nominal bore.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the model, draw the mass, then the pipe, the bonnet and stem, the handwheel and the contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No valve between the two read is made; the handwheel is one rim rod per side of a square; the stub's length, the rim's and the bonnet's sections are construction estimates.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Seven parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, how the model is chosen, its contact and why it states no travel.
