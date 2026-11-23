# src/render/inspection/IAutoMovieResolveInspectionColorsProps.ts#IAutoMovieResolveInspectionColorsProps

## @evidence contracts/development/design.md#principled-representation

Later matching recolor entries win; returned styles are fresh mutable records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieInspectionColors exchanges marks, reserved, recolor; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Later matching recolor entries win; returned styles are fresh mutable records.

## @evidence contracts/development/common.md#meaningful-documentation

Mark-kind defaults, occupied colors and ordered recoloring rules. resolveAutoMovieInspectionColors rejects conflicting label/default-color declarations for one kind and rejects final color collisions with another kind or reserved use. The prose and members document how resolveAutoMovieInspectionColors interprets and admits these values.
