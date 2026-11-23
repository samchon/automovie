# src/caption/isAutoMovieWebVttIdentifier.ts#isAutoMovieWebVttIdentifier

## @evidence contracts/development/implementation.md#principled-implementation

The predicate is the W3C WebVTT cue identifier production, one or more characters excluding line terminators and the substring `-->`, checked with a length test, one regular expression and one substring search; header text is held to the same production although WebVTT would accept it empty.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A pure predicate lets film assembly report a diagnostic while `serializeAutoMovieWebVttIdentifier` throws, both from the one rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every refused shape comes from the WebVTT grammar; the stricter blank-id rule stays in film assembly, which owns it, instead of being folded in here.

## @evidence contracts/development/common.md#meaningful-documentation

The doc lists the refused shapes, why each breaks the file, and which stricter rule a caller adds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Both checks are linear scans of the identifier, O(L) with no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A stateless predicate over one string has no completed work to share across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The predicate retains nothing and opens no handle or task.
