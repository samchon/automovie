# src/construction/IAutoMovieLoftFrameSource.ts#IAutoMovieLoftFrameSource.ISource

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the reusable axis callback from the copied layer binding and states when source playback is retained.

## @evidence contracts/development/design.md#principled-representation

LoftFrameSource.retain uses the axis jet at each station and falls back to its value callback if the jet is absent there. Validate compares layer station, frame and derivative presence and values with the retained data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Axis callbacks own frame evaluation. The per-layer snapshot records just the values used to detect a changed layer and to choose the analytic path.

# src/construction/IAutoMovieLoftFrameSource.ts#IAutoMovieLoftFrameSource.ISource.axis

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes callback availability from a derivative missing at an individual station.

# src/construction/IAutoMovieLoftFrameSource.ts#IAutoMovieLoftFrameSource.ISource.station

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the layer coordinate used to check the snapshot.

# src/construction/IAutoMovieLoftFrameSource.ts#IAutoMovieLoftFrameSource.ISource.frame

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains the component units and the value-only case.

# src/construction/IAutoMovieLoftFrameSource.ts#IAutoMovieLoftFrameSource.ISource.jet

## @evidence contracts/development/common.md#meaningful-documentation

The comment ties null to the axis callback and preserves the distinction from a missing frame value.
