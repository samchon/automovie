# src/inspector/IAutoMovieInspectorProps.ts#IAutoMovieInspectorProps

## @evidence contracts/development/design.md#principled-representation

The inspector's state is one request, so the page hands in its first text and listens for the text of each change; the subjects are the draw page's own subjects by name, so the page that draws and the page that inspects offer one record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The scaffold supplies the existing draw subject record, the first address query, the address listener and the fixed prefix of its existing capture script. A host without a capture entry point can omit the prefix.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The text is read once; the inspector owns the request afterwards, so a page cannot fight it by passing a new text each render.

## @evidence contracts/development/common.md#meaningful-documentation

States what each member is, the identity each subject must keep, when the text is read and what the listener receives.

# src/inspector/IAutoMovieInspectorProps.ts#IAutoMovieInspectorProps.onRequestChange

## @evidence contracts/development/common.md#meaningful-documentation

States what is received, when, and the default helper.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A callback signature; the page implements it.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A callback signature; the page implements it.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A callback signature; the page implements it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A callback signature; the page implements it.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A callback signature; the page implements it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A callback signature; the page implements it.
