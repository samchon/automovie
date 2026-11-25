# src/analysis/IAutoMovieWarnAnalysisTargetKeys.ts#IAutoMovieWarnAnalysisTargetKeys.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Report every declared target that names no metric the study reports. Member documentation states the supplied records, units and absence meanings used by warnAutoMovieAnalysisTargetKeys.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

String keys retain the open metric vocabulary; missing measurements remain their metric's own gaps rather than being reclassified as unknown keys.

## @evidence contracts/development/design.md#principled-representation

targets are compared against the complete reported key set across the study's runs, and warnings is the caller-owned append sink.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieWarnAnalysisTargetKeys.IProps, used by warnAutoMovieAnalysisTargetKeys. Its targets, keys, warnings members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
