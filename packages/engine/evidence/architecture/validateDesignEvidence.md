# src/architecture/validateDesignEvidence.ts#validateDesignEvidence

## @evidence contracts/development/implementation.md#principled-implementation

Resolves each citation through a document-to-candidate-set index, and detects repeats by a key serialized as a JSON array, which cannot collide for distinct (subject, document, candidate) triples whatever characters the ids contain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the citation contract between the building source and observed references; blank strings use the collector's shared rule, and duplicate reference ids are left to the production builder that owns the document set.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No document, subject or candidate is special-cased; competing readings may be cited together by design, and merging same-id references is a documented choice whose collision another layer reports.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states what a citation may and may not point at and why, every rule, what an unresolved document suppresses, the path root, that nothing throws, and how duplicate reference ids are treated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans R reference records, C citation records and their total candidate/cited entries, including empty lists. One document index and one set lookup per resolved citation entry give O(R + C + entries), apart from string/key construction lengths.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A validation of one citation list per call that coordinates no shared work across requests.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local document entries are bounded by reference records, their sets by reference candidate entries, and seen keys by cited entries. They are released on return; the caller owns findings.
