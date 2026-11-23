# src/caption/escapeWebVttText.ts#escapeWebVttText

## @evidence contracts/development/implementation.md#principled-implementation

WebVTT cue text defines the character references `&amp;`, `&lt;` and `&gt;`, and escaping `&` first keeps the later replacements from being escaped twice, so the mapping is reversible.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single shared escape is the only thing the cue-text and annotation serializers have in common, so it is its own function while their different line handling stays with each serializer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The escaped set is the WebVTT syntax set and nothing else; no input is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The doc names the exact escaped characters and why both serializers must share the escape.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three `replaceAll` passes are each linear in the text length; a single-pass replacer would save at most two scans of one caption line.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure per-string escape coordinates no phases, so there is no completed work to share between its callers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function returns a new string and keeps no state, handle or task.
