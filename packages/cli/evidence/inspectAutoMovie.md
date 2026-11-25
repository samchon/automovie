# src/inspectAutoMovie.ts#inspectAutoMovie

## @evidence contracts/development/common.md#meaningful-documentation

States how options are read and checked, what is served and printed, how the copied command gets the same module and props paths, which packages come from the production, and how the command ends.

## @evidence contracts/development/implementation.md#principled-implementation

Every rule of the request is the render package's and every rule of the page the viewer's; the command loads them from the production, serves, and reports, as `automovie capture` does.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read, serve, print, wait, close.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A request is read before serving. The installed capture command names its Node executable and CLI entry so it can run in another terminal. The validated module and props paths stay separate fixed arguments.

## @evidence contracts/development/implementation.md#efficient-algorithms

One server for the command's life.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One page per command.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The server and its page are closed when the process is interrupted; the signal listeners are removed with them.
