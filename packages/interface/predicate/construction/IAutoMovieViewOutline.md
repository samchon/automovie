# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IEnds

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies endpoint units, optional sides and the relevant knot premise.

## @evidence contracts/development/design.md#principled-representation

ViewOutline.create compares the end station and checks the corresponding final or initial knot against its relative zero tolerance, then infers a matching source map if needed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The end record carries closure stations only. The owner's outline controls define the scalar and parameter behavior.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IEnds.bottom

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the first knot's closing endpoint.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IEnds.top

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the last knot's closing endpoint.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IOutline

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains preparation ownership and the natural and quintic paths.

## @evidence contracts/development/design.md#principled-representation

ViewOutline.create copies source knots, establishes closure and source coordinates and prepares the natural spline. It requests a quintic when the authored ranges or jets require it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result retains the source data and prepared curves needed by value, jet and support readers. View loft construction consumes those capabilities independently of section publication.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IOutline.knots

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the copied data and order available to inspection.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IOutline.domain

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the saved knot interval from the interpolation coordinate.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IOutline.ends

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the independent closure policy saved with the source.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IOutline.parameter

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the parameter units and default.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IOutline.spline

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the underlying scalar interpolation law.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IOutline.hermite

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies when the alternate interpolant is present.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IFailure

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains when a caller receives the failure record.

## @evidence contracts/development/design.md#principled-representation

ViewOutline.create identifies ordering and scalar preparation errors as outline, mismatched closing knots as pole knot and an incompatible map as pole parameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record supplies the actual premise to ViewLoft and ViewCurves, which provide the field name and publishing context.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IFailure.contract

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the three groupings used by the producer.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IFailure.detail

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies where numerical refusal details appear.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains how to distinguish successful and failed preparation.

## @evidence contracts/development/design.md#principled-representation

Callers test for detail before creating a scalar reader; they can report that original failure and keep other source inputs inspectable.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union shares the explicit source and diagnostic records without adding another result wrapper.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IReading

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives both derivative coordinates and the reason the value is available separately.

## @evidence contracts/development/design.md#principled-representation

ViewOutlineRead.at evaluates the source polynomial and its parameter derivatives. It applies the physical chain rule when the derivative change is available and representable, and records the endpoint and availability reason.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Callers can consume a value or parameter derivatives without requiring a regular physical station jet. One reading also identifies its source-span location.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IReading.station

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the original query coordinate.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IReading.parameter

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the original station and the coordinate used for the spline.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IReading.value

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies value units and the explicit source tip behavior.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IReading.parameterJet

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives derivative order and availability at singular stations.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IReading.stationJet

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the physical derivative order and absent variant.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IReading.stationJetStatus

## @evidence contracts/development/common.md#meaningful-documentation

The comment lists the reason accompanying a null physical jet.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IReading.location

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies which portion of the source law supplied the read.
