# src/architecture/createBeerTap.ts#createBeerTap

## @evidence contracts/development/implementation.md#principled-implementation

Perlick's tower height, column, base, head depth and faucet spacing; Micro Matic's faucet length, spout, drop and lever stud, a standard faucet that fits a standard tower's shank.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the mass, then the base, column and head, then each faucet with its two contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The head is one level cylinder as long as the faucets' spacing plus its depth; the plate's, body's and stud's thicknesses are construction estimates; the mass is provisional.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Nine parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, where each faucet stands, what each contact is and what is left out.
