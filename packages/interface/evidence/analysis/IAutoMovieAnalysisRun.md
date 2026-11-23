# src/analysis/IAutoMovieAnalysisRun.ts#IAutoMovieAnalysisRun

## @evidence contracts/development/design.md#principled-representation `sealAutoMovieAnalysisRun` digests the settings text, checks the record with the contents rules `validateAutoMovieAnalysisRun` also applies, throws on the first violation, and only then digests the record; the validator recomputes that digest, so the stored seal is checked against the same canonical text that produced it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the supplied canonical settings text's digest is stored; complete settings acquisition belongs to the producer. Solver and outcome stay nested records read in fixed order and are retained by reference by sealing, so later mutation requires resealing or renewed validation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

JSON-array lines escape embedded separators without banning characters. Admission visits missing metric/sample/warning slots, but other nested containers and ordinary data fields remain typed premises and malformed host records can throw before returning violations; sealing is neither an exact-key schema check nor independent execution provenance.

## @evidence contracts/development/common.md#meaningful-documentation

States why the input revision makes a result stale, what the digest seals and that validation recomputes it, the digest text form, and the id uniqueness a report enforces.
