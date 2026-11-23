# src/architecture/IAutoMovieDesignEvidence.ts#IAutoMovieDesignEvidence

## @evidence contracts/development/design.md#principled-representation

validateDesignEvidence unions candidate ids by document id, checks cited membership and detects repeats with JSON-array subject/document/candidate keys. A missing document skips candidate count/membership/duplicate checks after subject/rationale checks; callers must establish unique consistent document identities because production merging is retired. The validator neither validates the whole reference nor verifies rationale truth or subject ownership.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The citation lives on the design side and names document and candidates by id, so observation records stay unchanged and one design element can cite several documents through several citations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unsettled and withheld candidates are citable by design rather than filtered, and the subject is only checked for being non-blank, a gap the member states instead of claiming resolution.

## @evidence contracts/development/common.md#meaningful-documentation

States citation direction, explicit Engine validation, unsettled-candidate allowance, unresolved subject ownership and the rationale's intended explanation.
