# src/render/AutoMovieEngineCaptureRecord.ts#AutoMovieEngineCaptureRecord.observe

## @evidence contracts/development/common.md#meaningful-documentation

The reader distinguishes missing, unfinished and malformed records. Its JSDoc names the fields older records may omit, the aligned numeric trails a drawn cell can retain, and the caller's responsibility for hash and scope checks.

## @evidence contracts/development/implementation.md#principled-implementation

Admit a complete record only when its name, cell addresses, diagnostic clocks and coverage rows are usable. A producer's optional paths are strings with content and an optional collision basis is static or swept. Drawn-row trails are admitted with bounded paths and finite, aligned placed samples; a failed row cannot retain them. Historical rows can omit these fields. Return the original facts without recomputing them.

## @evidence contracts/development/implementation.md#efficient-algorithms

Validate each row and its optional paths and trail samples in one pass. Retain the admitted coverage and episode arrays and allocate only the cell and comparison projections required by the observation result.

# src/render/AutoMovieEngineCaptureRecord.ts#AutoMovieEngineCaptureRecord.comparison

## @evidence contracts/development/common.md#meaningful-documentation

The reader returns comparable cells, their optional source-backed motion trails and any recorded audit from a complete round.

## @evidence contracts/development/implementation.md#principled-implementation

Require complete record ownership names and admissible cell identity. Validate audit clocks, findings, and coverage even when comparison uses only part of them. Accept legacy coverage and stills. Validate optional source-supplied coverage paths, checker basis and drawn motion trail arrays when present.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scan declared files, cells, bounded trail samples and audit rows once. Retain their existing arrays and do not read picture bytes.
