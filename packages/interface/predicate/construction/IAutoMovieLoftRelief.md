# src/construction/IAutoMovieLoftRelief.ts#IAutoMovieLoftRelief

## @evidence contracts/development/common.md#meaningful-documentation

The comment describes how the window, control net and direction compose with the base and identifies the edge condition.

## @evidence contracts/development/design.md#principled-representation

LoftRelief evaluates a tensor-product cubic in station and phase. ReliefCompose applies displacement along the fixed or phase-dependent axis. The author supplies the control border and any per-station map.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The relief adds a height field without copying the base chain. The same parameters drive point, phase and jet readers.

# src/construction/IAutoMovieLoftRelief.ts#IAutoMovieLoftRelief.name

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the name's reporting and part identity role.

# src/construction/IAutoMovieLoftRelief.ts#IAutoMovieLoftRelief.stations

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies the window's coordinate and order.

# src/construction/IAutoMovieLoftRelief.ts#IAutoMovieLoftRelief.phases

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains wrapping and the full-window boundary convention.

# src/construction/IAutoMovieLoftRelief.ts#IAutoMovieLoftRelief.axis

## @evidence contracts/development/common.md#meaningful-documentation

The comment fixes the vector frame and phase reference.

# src/construction/IAutoMovieLoftRelief.ts#IAutoMovieLoftRelief.turn

## @evidence contracts/development/common.md#meaningful-documentation

The comment supplies the exact rotating basis, reference phase and default.

# src/construction/IAutoMovieLoftRelief.ts#IAutoMovieLoftRelief.rows

## @evidence contracts/development/common.md#meaningful-documentation

The comment derives the minimum from the cubic border and remaining interior.

# src/construction/IAutoMovieLoftRelief.ts#IAutoMovieLoftRelief.columns

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the dimension and derives the minimum from the same border.

# src/construction/IAutoMovieLoftRelief.ts#IAutoMovieLoftRelief.heights

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies flattened index order, units and edge padding.

# src/construction/IAutoMovieLoftRelief.ts#IAutoMovieLoftRelief.shift

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies shift units, shared controls layout, remapping and default.

# src/construction/IAutoMovieLoftRelief.ts#IAutoMovieLoftRelief.IRange

## @evidence contracts/development/common.md#meaningful-documentation

The comment assigns units and order to each receiving field.

## @evidence contracts/development/design.md#principled-representation

The station reader normalizes from start to end. The phase reader derives a cyclic width from the same pair shape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The small range is shared across the two axes. Each relief field owns its own coordinate interpretation.

# src/construction/IAutoMovieLoftRelief.ts#IAutoMovieLoftRelief.IRange.start

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the starting coordinate from a window length.

# src/construction/IAutoMovieLoftRelief.ts#IAutoMovieLoftRelief.IRange.end

## @evidence contracts/development/common.md#meaningful-documentation

The comment ties the endpoint to the special interpretation in phase.
