# src/vehicles/createDoubleScull.ts#createDoubleScull

## @evidence contracts/development/implementation.md#principled-implementation

The open thin hull uses lofted wall cells, both seat frames ride their modeled sliders and each oar uses two colocal articulated pivots.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the shell once, then repeat the station geometry twice with different origins and ids.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The cockpit is open and the seats, stretcher faces and blade tips come from the drawn parts.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of short hull cells and station parts are prepared per model.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One cross-section family spans the hull and both stations share one rigging construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned builder product owns its model buffers without retaining scene or caller data.

## @evidence contracts/development/common.md#meaningful-documentation

States the model axes, waterline, moving parts, estimates and measurement sources.
