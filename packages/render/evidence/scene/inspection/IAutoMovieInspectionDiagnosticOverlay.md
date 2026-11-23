# src/scene/inspection/IAutoMovieInspectionDiagnosticOverlay.ts#IAutoMovieInspectionDiagnosticOverlay

## @evidence contracts/development/design.md#principled-representation

A live resource with one draw call per picture and one release.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Viewer draws through it every painted frame; a one-shot capture uses `renderWithAutoMovieInspectionDiagnostics`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The overlay is attached only while the picture renders, so no observation or other pass sees it.

## @evidence contracts/development/common.md#meaningful-documentation

States what it holds and when it is attached.

# src/scene/inspection/IAutoMovieInspectionDiagnosticOverlay.ts#IAutoMovieInspectionDiagnosticOverlay.render

## @evidence contracts/development/common.md#meaningful-documentation

States what one call draws and returns.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the overlay that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the overlay that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the overlay that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the overlay that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the overlay that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the overlay that implements it answers.

# src/scene/inspection/IAutoMovieInspectionDiagnosticOverlay.ts#IAutoMovieInspectionDiagnosticOverlay.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what is released and that a repeated call does nothing.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the overlay that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the overlay that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the overlay that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the overlay that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the overlay that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the overlay that implements it answers.
