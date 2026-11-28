# src/recovery/IAutoMovieRecoveryImageView.ts#IAutoMovieRecoveryImageView

## @evidence contracts/development/common.md#meaningful-documentation

The declaration states the borrowed lifetime and exact three-byte storage layout for the chart's width and height. Recovery checks the required byte count before scanning.

## @evidence contracts/development/design.md#principled-representation

The view extends the shared chart with its top-to-bottom RGB8 raster. Scan offsets use exactly three adjacent channels at each row and column address.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The view adds only the resident raster to the common chart. The generated file host supplies the decoded buffer, and the completed observation retains chart metadata and measured support instead of that buffer.

# src/recovery/IAutoMovieRecoveryImageView.ts#IAutoMovieRecoveryImageView.rgb8

## @evidence contracts/development/common.md#meaningful-documentation

The observer reads adjacent RGB slots at 3 × (row × width + column) after checking the byte count against the chart dimensions.
