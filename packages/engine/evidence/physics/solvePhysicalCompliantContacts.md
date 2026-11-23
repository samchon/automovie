# src/physics/solvePhysicalCompliantContacts.ts#solvePhysicalCompliantContacts

## @evidence contracts/development/common.md#meaningful-documentation

States the sensor source, the measurement, the law with its symbols and units, the friction bound, the gains, the refusals and the returned fields.

## @evidence contracts/development/implementation.md#principled-implementation

The Kelvin-Voigt contact (spring and dashpot in parallel) integrated implicitly over one substep, with series compliance of the two surfaces; dividing every term by the larger of compliance and dt (dt + c_d) w first keeps the finite rigid limit instead of an infinity over infinity. The effective inverse mass is `1/m + (r x n) . I^-1 (r x n)` on each body (Eberly, Game Physics, 2010, ch. 6). 0.5 is the mean of the two friction coefficients.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the step's sensor overlaps; detection is the world's, distance physicalShapePairContact's, receipts recordPhysicalContact's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No shape, body or material category has its own rule. Overflowing products and non-finite intermediate values throw instead of being clipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the step's sensor overlaps, one distance query and four directional inverse masses per responding pair.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads one completed step's overlaps at the current poses; nothing is reusable across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing between calls; the visited-pair set dies with the call and the measurements are the caller's.
