# src/film/gatePerformShotScript.ts#gatePerformShotScript

## @evidence contracts/development/implementation.md#principled-implementation

A beat id names one beat, so every later declaration of an id is refused at its own path, and the performance's beat resolves to the first declaration, the one the refusal points back to.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Structure: `performShot` owns the stage order; this function owns only the script's beat ids and the lookup of the performed beat, which the assembly reads for the shot's name.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No beat or id is special-cased; every duplicate is reported, not only the performed one.

## @evidence contracts/development/common.md#meaningful-documentation

States the violation, its path and message, which declaration the lookup returns and when it returns undefined.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the beats with a map of first indices, `O(b)`.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Runs once per shot over that shot's script; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Appends to the caller's collector and retains nothing after return.
