# src/serveAutoMovieInspectorPage.ts#serveAutoMovieInspectorPage

## @evidence contracts/development/common.md#meaningful-documentation

States what the page runs, how the host's optional capture prefix reaches it, which configuration serves it, where it listens, what the return holds, and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A person inspecting edits sources between looks, so the page is served by Vite's development server, which compiles each module when the page asks for it; capture draws a built page instead because it must not reload between cells.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Write the page, find a port, start the server; the inspector and the subjects are the page's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The production's existing page and configuration file are left untouched. The generated page receives the capture prefix as data. A taken port fails the start.

## @evidence contracts/development/implementation.md#efficient-algorithms

One server for the command's life; Vite compiles what the page imports.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One page per command.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The server and the scratch folder are owned by the returned `close`, which stops one and deletes the other; a failed start deletes the folder before rejecting.
