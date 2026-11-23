# src/architecture/validateGeneratedAcquisition.ts#validateGeneratedAcquisition

## @evidence contracts/development/implementation.md#principled-implementation

Number.isSafeInteger admits the integer range whose adjacent seed identities survive JSON-number transport. Digest spelling is lowercase SHA-256, and seed-presence rules run after seed-domain admission; this metadata gate does not execute the provider or certify replay of its bytes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the acquisition record's honesty rules, using the collector's blank-string rule and the shared digest pattern instead of private copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No provider or model is special-cased; an irreproducible seed is a warning by contract because it is not a defect in the bytes, and nothing is normalized to pass.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why each rule exists, the seed domain and its precedence, every field rule, the null-digest meaning, the path root, which finding is a warning, and that inputs are not resolved.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the input path count plus lengths of strings trimmed or tested; numeric and Boolean fields add constant work. Findings retain rejected values instead of copying asset bytes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One supplied generation record is checked per call; this gate retains no shared result and makes no equivalence assumption about mutable records.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Builds only the returned validation from a local collector, a bounded number of findings per field and one per input path; nothing else outlives the call.
