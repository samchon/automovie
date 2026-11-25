# src/geometry/construction/AutoMovieLoftStations.ts#AutoMovieLoftStations.bisect

## @evidence contracts/development/implementation.md#principled-implementation

Keeps principal layers and recursively bisects intervals whose midpoint ring exceeds the chord tolerance at the 48 declared phases. With a local callback, it reads the tolerance from the endpoints of each tested interval. Valid increasing endpoints and layers are caller premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One depth-first splitter passes endpoint rings to both children and appends accepted right endpoints in order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The depth bound may leave a coarse interval even above tolerance, and finite midpoint/phase probes do not certify continuous maximum error; neither limitation is hidden by smoothing.

## @evidence contracts/development/common.md#meaningful-documentation

States physical tolerance units, the optional interval-based tolerance, fixed marks, probe criterion, recursion bound and endpoint inclusion.

## @evidence contracts/development/implementation.md#efficient-algorithms

For L principal intervals and depth D, at most O(L\*2^D) ring tests of 48 points run. Chain evaluation and one local tolerance read per tested interval are additional. Refinement stops early when the sampled rule passes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every tested midpoint ring is reused as its children's common endpoint; adjacent principal intervals reuse the preceding endpoint ring.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Working rings follow one recursion path, O(48D), beside O(L) marks and the O(L\*2^D) worst-case returned stations; no ring cache survives the call.
