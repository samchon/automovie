# src/describeAutoMovieInstanceSetSubject.ts#describeAutoMovieInstanceSetSubject

## @evidence contracts/development/implementation.md#principled-implementation

Reads the set's placement and bounds from its compiled record, which the kernel measured over every member, and pages members by slot arithmetic, so even a set of millions is described without regenerating a member.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner for an instance-set subject, called by the subject describer for both single and inventory description.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No set or layout is special-cased; a set whose first LOD model is unknown is described without materials rather than with guessed ones.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the model, transform, bounds and units, the owner and space, and how the member page is drawn, sized, addressed and ordered.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant in the set's count: only one page of at most the sample limit of addresses is generated and sorted.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Describes one set per call and coordinates no shared work; the compiled bounds it reports were measured once by the kernel.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new description holding at most one page of addresses, and retains nothing.
