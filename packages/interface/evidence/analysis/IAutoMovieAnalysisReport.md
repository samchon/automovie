# src/analysis/IAutoMovieAnalysisReport.ts#IAutoMovieAnalysisReport

## @evidence contracts/development/design.md#principled-representation `summarizeAutoMovieAnalysis` validates every run, folds them into the six fixed domain rows, and sets status by precedence: a missed metric of a current solved run gives `misses`, else any gap gives `incomplete`, else `meets`; the digest is SHA-256 over newline-joined lines, each one JSON array of the listed fields, so no separator inside a field can collide with a field boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Fixed rollup rows plus a bounded gap list and an omitted count keep the artifact readable at a glance, and the digest field seals it without a separate signature record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Valid unsupported/not-run outcomes, stale runs, value-less metrics and unanswered required domains become gaps; malformed runs throw instead of becoming gaps. A miss outranks gaps, warnings and untargeted values do not prevent meets, and the digest covers the omitted count but not omitted gap text or each originating run seal.

## @evidence contracts/development/common.md#meaningful-documentation

States the status precedence and exact meaning of `meets`, the gap bound and its default, gap ordering, the omitted count, the non-blank revision, and which fields the digest covers.
