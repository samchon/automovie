# src/production/IAutoMovieProductionFrameIntervalToGridTicks.ts#IAutoMovieProductionFrameIntervalToGridTicks.IProps

## @evidence contracts/development/design.md#principled-representation

The source interval is [startFrame, endFrame) and the result [start, end) in destination ticks; both endpoints use one rate and rounding rule. Input endpoints must be nonnegative safe integers with end after start.

## @evidence contracts/development/design.md#minimal-and-owned-surface

productionFrameIntervalToGridTicks composes the shared boundary converter for sound trims and subtitle intervals, preserving adjacent boundaries exactly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A positive frame interval that collapses to one destination boundary throws; the result therefore has positive tick duration without fabricating a minimum tick.

## @evidence contracts/development/common.md#meaningful-documentation

Half-open film intervals mapped to half-open integer-clock intervals. The source interval is [startFrame, endFrame) and the result [start, end) in destination ticks; both endpoints use one rate and rounding rule. Input endpoints must be nonnegative safe integers with end after start.

# src/production/IAutoMovieProductionFrameIntervalToGridTicks.ts#IAutoMovieProductionFrameIntervalToGridTicks.IResult

## @evidence contracts/development/design.md#principled-representation

The source interval is [startFrame, endFrame) and the result [start, end) in destination ticks; both endpoints use one rate and rounding rule. Input endpoints must be nonnegative safe integers with end after start.

## @evidence contracts/development/design.md#minimal-and-owned-surface

productionFrameIntervalToGridTicks composes the shared boundary converter for sound trims and subtitle intervals, preserving adjacent boundaries exactly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A positive frame interval that collapses to one destination boundary throws; the result therefore has positive tick duration without fabricating a minimum tick.

## @evidence contracts/development/common.md#meaningful-documentation

Half-open film intervals mapped to half-open integer-clock intervals. The source interval is [startFrame, endFrame) and the result [start, end) in destination ticks; both endpoints use one rate and rounding rule. Input endpoints must be nonnegative safe integers with end after start.
