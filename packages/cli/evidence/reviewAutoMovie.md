# src/index.ts#reviewAutoMovie

## @evidence contracts/development/common.md#meaningful-documentation

States how options are read, what records, what is written where, what is printed and the status with its reason.

## @evidence contracts/development/implementation.md#principled-implementation

The recording's rules are `recordAutoMoviePlayback`'s; the command supplies the production's Playwright and writes the result.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read, record, write, report.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unknown option is refused; a page error is reported in the status, not hidden.

## @evidence contracts/development/implementation.md#efficient-algorithms

One recording.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One review per command.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The browser is the recording's and closed by it.
