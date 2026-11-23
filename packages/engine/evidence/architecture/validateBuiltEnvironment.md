# src/architecture/validateBuiltEnvironment.ts#validateBuiltEnvironment

## @evidence contracts/development/implementation.md#principled-implementation

Validates the record as a graph of declared ids, resolving every reference through id sets, then judges staged geometry only once the graph is sound, because the staged checks place elements through their parents and would answer arbitrarily over a dangling or cyclic hierarchy; nested model and surface validation is re-rooted onto this record's paths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The orchestrator of building validation: each section with rules of its own lives in its own `validateBuilt*` function, and the shared id, reference, cycle, outline and region rules come from their owners, so this file states the order, the cross-section references, the opening voids and the staging gate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No building, kind or id is special-cased; a defect already reported is not compounded, so an opening on an unusable face is not also reported as leaving it, and staged checks wait for an error-free record instead of guarding each unusable input.

## @evidence contracts/development/common.md#meaningful-documentation

Lists section order, staging gate, path root/warnings and guarded consumers; distinguishes collected record defects from malformed-container or runtime-resource exceptions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays all nested model/surface and `validateBuilt*` costs: reference indexing, summed parent-chain ownership walks, state-by-member assignment checks, route/landing sampling, outline geometry and opening-pair comparisons. Staged individual/Cartesian state checks add repeated staging and containment, with exponential worst-case cost in interacting operations; id indexing alone does not make the complete validator linear.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Validates the supplied mutable record per call. Lowering and guarded consumers invoke it; low-level queries can instead require an already-valid record and do not all validate independently. No persistent validation cache is maintained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The id sets, face and hull maps and the work-wide driven-element table are local and released on return, each bounded by its record count; the returned validation holds the findings.
