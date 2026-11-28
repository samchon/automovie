# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IAxis

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the common frame, station units and the distinction between value and derivative capabilities.

## @evidence contracts/development/design.md#principled-representation

ViewAxis builders produce the section-frame callback and analytic owners expose a separate jet. LoftFrameSource retains such a source when available and uses it for unchanged common-source spans.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interface supplies one placement callback and optional analytic projection. Parallel-axis serialization metadata is available on its actual owner.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IAxis.at

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the input coordinate and the frame component units.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IAxis.jet

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the station argument from the optional derivative coordinate and unavailable state.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IAxis.parallel

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the shape and provenance restored by the source operation.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IAxisKnot

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the position frame, station order and shared units.

## @evidence contracts/development/design.md#principled-representation

The minimal axis builder interpolates the station-associated world positions and transports its frame along that curve.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The knot pairs one coordinate with one world point. The curve and frame owner derives tangent and chart directions.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IAxisKnot.station

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the knot key and its required order.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IAxisKnot.point

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the shape and units of the control point.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IAxisKnot1

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the two axes of the input and their units.

## @evidence contracts/development/design.md#principled-representation

ViewAxis.level fits separate natural splines to the station/value arrays for X and Z and uses station directly as world Y.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same scalar pair serves either horizontal coordinate. The receiving level-axis argument establishes its role.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IAxisKnot1.station

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the axis convention and required input order.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IAxisKnot1.value

## @evidence contracts/development/common.md#meaningful-documentation

The comment assigns the value's component to the receiving curve.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IRun

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the station conversion and bounds of the straight placement operation.

## @evidence contracts/development/design.md#principled-representation

ViewAxis.runs uses the shared jointed-course preparation, subtracts adjacent setbacks from the original segment and derives its straight arclength stations from the preceding turn.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result carries one offset interval and its station interval. Turn shape and transport remain owned by the jointed course.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IRun.from

## @evidence contracts/development/common.md#meaningful-documentation

The comment names the origin of the lower segment offset.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IRun.to

## @evidence contracts/development/common.md#meaningful-documentation

The comment names the subtraction that produces the upper offset.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IRun.start

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the lower offset and arclength correspondence.

# src/construction/IAutoMovieViewAxis.ts#IAutoMovieViewAxis.IRun.end

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the upper offset and arclength correspondence.
