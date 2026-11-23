# src/render/inspection/IAutoMovieInspectionLabelPlacement.ts#IAutoMovieInspectionLabelPlacement

## @evidence contracts/development/design.md#principled-representation

A dropped projection may have nonfinite pixel coordinates; consumers must not assume it is drawable.

## @evidence contracts/development/design.md#minimal-and-owned-surface

placeAutoMovieInspectionLabels exchanges labels, dropped; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A dropped projection may have nonfinite pixel coordinates; consumers must not assume it is drawable.

## @evidence contracts/development/common.md#meaningful-documentation

Greedy label placement result in output pixels. placeAutoMovieInspectionLabels keeps input order, never moves an anchor, and lists overlapping, off-picture or nonvisible-depth anchors in dropped. The prose and members document how placeAutoMovieInspectionLabels interprets and admits these values.
