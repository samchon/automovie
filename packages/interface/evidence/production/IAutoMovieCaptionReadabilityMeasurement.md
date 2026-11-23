# src/production/IAutoMovieCaptionReadabilityMeasurement.ts#IAutoMovieCaptionReadabilityMeasurement

## @evidence contracts/development/design.md#principled-representation

Grapheme totals and maximum line length count segmenter output over canonical lines, duration is endFrame minus startFrame, gap uses the preceding same-language cue and reading rate is graphemes times fps divided by durationFrames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Measurements retain cue and actual segmentation identity beside raw counts and timing, allowing a profile verdict to remain a separate outcome rather than baking thresholds into these observations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

UTF-16 code units do not substitute for grapheme clusters, and a missing preceding cue has null gap rather than a fabricated large gap that would automatically pass a minimum.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies canonical text and language, exact segmenter, authored line counts, frame duration and same-language gap, and graphemes-per-second units.
