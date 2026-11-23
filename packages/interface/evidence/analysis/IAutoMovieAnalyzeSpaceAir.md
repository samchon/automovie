# src/analysis/IAutoMovieAnalyzeSpaceAir.ts#IAutoMovieAnalyzeSpaceAir.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Solve one space for ventilation, and refuse to pretend it solved the air. Member documentation states the supplied records, units and absence meanings used by analyzeAutoMovieSpaceAir.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No velocity-field or stagnation surrogate is added to the zone request; these remain unsupported, and zero-flow steady concentration is an explicit gap.

## @evidence contracts/development/design.md#principled-representation

request supplies the canonical zone volume, flow and occupancy quantities; analyzeAutoMovieSpaceAir validates them before reporting zone-average rates and concentration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieAnalyzeSpaceAir.IProps, used by analyzeAutoMovieSpaceAir. Its request members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
