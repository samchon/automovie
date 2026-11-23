# src/film/validateShotProgramContract.ts#validateShotProgramContract

## @evidence contracts/development/implementation.md#principled-implementation

Compares registration and program fields by strict equality, so a duration must be the identical number rather than a near value, and checks actors and samples in one indexed pass each with first-index maps; a duplicated sample is reported once and the window check reads the later sample, which is moot because the duplicate already fails the program.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split from `compileDefinedShot` as the single owner of the program-to-registration rules, so the compiler sequences phases and this function decides only whether the builder returned the registered artifact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads only registration and program fields; no beat, scene or event id is special, and a mismatch is reported for the author to correct rather than copied from the registration onto the program.

## @evidence contracts/development/common.md#meaningful-documentation

States every field equality, the actor and event-sample rules with the window's unit and inclusiveness, that only an actor's first fault is reported, and what an empty result means.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in staged actors, actor programs, event samples and contract events: staged actors and declared event ids are read into sets once, so the undeclared-sample check is a lookup rather than a scan of the contract per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure check over one program that coordinates no work across calls or consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only per-call sets, maps and diagnostics; the caller owns the returned diagnostics, bounded by five field checks plus one per actor, one per sample and one per contract event.
