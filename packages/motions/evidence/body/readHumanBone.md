# src/body/readHumanBone.ts#readHumanBone

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned, which record a repeated name gives, who owns the index and the absent case.

## @evidence contracts/development/implementation.md#principled-implementation

The body's name-to-record map, filled in list order keeping the first record of a name, gives what `Array.prototype.find` gives for that name on the same list.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The record is the rig's own, never a copy or a default; an absent name is undefined, as a scan reports it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One map read a lookup, in place of a scan of up to B records.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The index is the body's, built once with it and shared by every lookup.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the body owns its index.
