# src/architecture/builtEnvironmentSupportSweep.ts#builtEnvironmentSupportSweep

## @evidence contracts/development/implementation.md#principled-implementation

Descending candidate top heights and a binary-searched ceiling of underside plus tolerance choose the highest footprint-overlapping part box within that ceiling. Signed clearance may be negative; subject union footprints and candidate boxes are the stated proxies, not proof of physical contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Body resolution is the shared `resolveBuiltPlacementBody` over one `builtEnvironmentPartBoxes` table, the footprint test is `builtFootprintsOverlap`, and the default slack is the constant shared with the status query, so this function owns only the sweep and its classification.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no element, population or part; the ground plane is an input with a stated default rather than an exemption for particular bodies, and an invalid tolerance or ground height is refused rather than defaulted.

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured and what is not claimed, why parts replace boxes, the grounded, borne and floating classes, the `groundY` default and why it exists, how a point body reads, each refusal, and what every count means.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays one batch part-table measurement, each body's union or population placement fold and O(R²) worst-case population lookups for R populations. With B resolved bodies and P part boxes, sorting is O(P log P), binary searches O(B log P), and scans O(BP) worst case. `compared` excludes self candidates and does not count resolution, sorting or search work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Within one sweep the single staging and part table are shared by every body's resolution instead of restaging the building per body; across calls nothing is cached because the record is the caller's mutable data.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The part table, resolved bodies and sorted candidates live only for the call and grow linearly with the element, population and part counts; the caller owns the returned report.
