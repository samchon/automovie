# src/launchAutoMovieChromium.ts#launchAutoMovieChromium

## @evidence contracts/development/common.md#meaningful-documentation

States what is launched, the description's form and both failures.

## @evidence contracts/development/implementation.md#principled-implementation

Switches come from `planAutoMovieChromiumLaunch`; Playwright reports a missing browser as an executable that does not exist, which is the message matched, so only that case is turned into the install instruction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan, launch, describe.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No other browser or backend is tried after a failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

One launch.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each capture host launches its own browser.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned browser is the caller's to close; a failed launch leaves none.
