# src/render/IAutoMovieConstructionPolyline.ts#IAutoMovieConstructionPolyline

## @evidence contracts/development/design.md#principled-representation

Closed paths omit the repeated first point; the builder draws supplied samples without refitting.

## @evidence contracts/development/design.md#minimal-and-owned-surface

buildAutoMovieConstruction exchanges id, closed, points; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed paths omit the repeated first point; the builder draws supplied samples without refitting.

## @evidence contracts/development/common.md#meaningful-documentation

Ordered generating polyline in model-local metres. buildAutoMovieConstruction requires unique nonempty ids, finite float32-representable coordinates and at least two open or three closed points within the caller's total point budget. The prose and members document how buildAutoMovieConstruction interprets and admits these values.

# src/render/IAutoMovieConstructionPolyline.ts#IAutoMovieConstructionPolyline.IMutable

## @evidence contracts/development/common.md#meaningful-documentation

Preserves producer list mutation and warns that shared tuples need copying before independent edits.

## @evidence contracts/development/design.md#principled-representation

The base's id, implicit closure and model-metre coordinates are unchanged; only list capability is mutable.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Engine and recovery publish this view while render borrows the base contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Mutable lists do not promise unique point ownership or renderer-budget admission.
