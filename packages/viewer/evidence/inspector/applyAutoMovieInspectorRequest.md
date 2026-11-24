# src/inspector/applyAutoMovieInspectorRequest.ts#applyAutoMovieInspectorRequest

## @evidence contracts/development/common.md#meaningful-documentation

States which request is applied, the fallback to the request that asks for nothing, what is returned and the refusal that still throws.

## @evidence contracts/development/implementation.md#principled-implementation

A subject that refuses the wanted inspection is still shown, under the request that asks for nothing for the same subject, and the refusal's message is returned so the page reports it, as the mount did inline before.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The arrival's request fallback, moved out of `mountAutoMovieInspectorScene` unchanged so the mount stays under 500 lines.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the first refusal falls back; a refusal of the empty request propagates.

## @evidence contracts/development/implementation.md#efficient-algorithms

One or two inspection applications.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each arrival applies its own request.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned inspection is the caller's to restore.
