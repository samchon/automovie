# src/scene/inspection/createAutoMovieInspectionDiagnosticOverlay.ts#createAutoMovieInspectionDiagnosticOverlay

## @evidence contracts/development/common.md#meaningful-documentation

States which witnesses are shown, their shape, when the cubes are reused or rebuilt and how long they are attached.

## @evidence contracts/development/implementation.md#principled-implementation

The witness's measured world point centres its cube. The stroke builder rereads its marks' coordinate arrays on update, so moved witnesses reuse the built buffers and materials.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Select witnesses, reuse or rebuild one mark set, bracket the caller's render with attachment and detachment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Possible and confirmed evidence have different colours and legend entries. No world location is inferred from coverage or an interval alone.

## @evidence contracts/development/implementation.md#efficient-algorithms

A repeated colour sequence costs one vertex rewrite linear in the cubes; geometry and materials are built only when the sequence or stroke changes. Empty samples draw directly.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the inspection mark builder, its buffers and materials across pictures, and the caller's one render.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds at most one built mark set, released when replaced and by `dispose`; it never stays attached to the scene between pictures.
