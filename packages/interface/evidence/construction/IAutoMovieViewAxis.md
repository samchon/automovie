# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IAxis

## @evidence contracts/development/design.md#principled-representation

at reads the actual source plane; jet, when supplied, differentiates that same source instead of a resampled frame spline.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Value-only axes remain supported and analytic owners add one explicitly optional callback.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing analytic derivatives remain absent; a numerical minimal-rotation frame does not acquire an exact jet guarantee.

## @evidence contracts/development/common.md#meaningful-documentation

Callers must keep source data immutable; jet may return null at a singular or unrepresentable station.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IAxisKnot

## @evidence contracts/development/design.md#principled-representation

A station/point pair defines an original natural-curve datum.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One scalar and one triple carry each knot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No frame derivative is inferred by the record itself.

## @evidence contracts/development/common.md#meaningful-documentation

Members state units and increasing station order.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IAxisKnot1

## @evidence contracts/development/design.md#principled-representation

A scalar knot specifies one original level-course offset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two numbers carry the scalar source datum.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record neither validates station order nor invents derivative data.

## @evidence contracts/development/common.md#meaningful-documentation

Both members state kernel mm units.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IRun

## @evidence contracts/development/design.md#principled-representation

A point at a distance along a segment's straight run stands at the run's start station plus that distance past the run's start, because the course is the segment's own line there and its station is arclength.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four numbers: the run's two ends as distances from the segment's first centre and as stations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A point inside a turn has no station on the segment's line; the run says where that begins rather than guessing one.

## @evidence contracts/development/common.md#meaningful-documentation

States each field, its unit and what lies outside the run.
