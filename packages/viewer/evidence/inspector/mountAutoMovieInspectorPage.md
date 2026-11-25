# src/inspector/mountAutoMovieInspectorPage.tsx#mountAutoMovieInspectorPage

## @evidence contracts/development/common.md#meaningful-documentation

States what is rendered, where the first request comes from, how the address follows it, which inputs including the optional command belong to the host, and what `unmount` releases.

## @evidence contracts/development/implementation.md#principled-implementation `createRoot` is React 19's client entry, and StrictMode runs the canvas effect twice in development, which the scene mount is built to survive, so a page always exercises that path.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three steps: build the address writer, create the root, render the component with the address's query.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The host supplies the subjects, first request text, address writer inputs and capture command prefix.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work beyond React's own render.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A page is mounted once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The React root owns the component tree until `unmount`, which unmounts it and so releases the scene, renderer and frame loop the component holds.
