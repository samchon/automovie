# src/scene/inspection/parseAutoMovieInspectionRequest.ts#parseAutoMovieInspectionRequest

## @evidence contracts/development/common.md#meaningful-documentation

Tabulates every key with its accepted text and its absent value, states the switch rule, what a refusal reports and where kinds are checked instead.

## @evidence contracts/development/implementation.md#principled-implementation

Each key is read once through the caller's reader and admitted against the type's own members, so the returned record is complete and every value in it is one the request type allows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record literal with one helper per value form: pattern list, switch, positive number and cut.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unreadable text throws instead of falling back to the absent value, and the shade table is a record keyed by the request's union, so a shade added there fails compilation here until it is listed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the length of the text read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each key is read and parsed once per call and nothing is computed twice.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The call keeps nothing: the reader is used and dropped, and the returned record is the caller's.
