# src/scene/inspection/admitAutoMovieInspectionPatterns.ts#admitAutoMovieInspectionPatterns

## @evidence contracts/development/common.md#meaningful-documentation

States the two checks, their inputs, when each runs and the refusal behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Kind names are known before geometry, including declared names with no current mark. Path patterns need actual object and selected mark paths. Colour patterns admit either an actual path or an available kind.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reject unknown mark kinds up front, then return the path check that uses the same kind list after measurement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both checks use the same path-pattern matcher. Declared kinds alone supply neither object paths nor mark geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

The return check visits supplied and measured marks once to collect distinct paths. Each requested pattern scans the applicable kind and path names until a match, using the existing path matcher.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The path check reuses the kind list admitted for exactly the same request and supplied marks. A different request or mark set requires a new check.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned check borrows the request and supplied marks and holds one list of kind names. The inspection calls it during setup. It acquires no scene handles and keeps no measured paths after the call.
