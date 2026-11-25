# src/actions/walkReachShort.ts#walkReachShort.short

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit and both floors.

## @evidence contracts/development/implementation.md#principled-implementation

The shared lowering owner's cosine-law reach at `KNEE`, floored at the leg's length of slack.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner call and one floor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tuned bound; the outside-reach result is the owner's.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `lowerHumanPosture.short`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/walkReachShort.ts#walkReachShort.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed measured-body premise, world-metre varying points, signed claim and slack floor.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the shared lowering owner's cosine-law reach at `KNEE`, its horizontal-distance comparison and Pythagorean vertical reach, floored at the leg's length of slack.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reach preparation feeds a scalar claim reader, used both by ground's root trials and a walk's descent samples.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Applies `short`'s knee threshold, outside-reach result and slack floor to every point pair, with no tuned bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fixed cosine and reach square root prepare once rather than in every root/descent probe; each point pair keeps its horizontal distance and remaining square root.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ground solve or the take owns the body's measured lengths and the knee floor; another body requires a new reader, and no queried claim is shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One owner-local closure retains the scalar reach reader until its solve/take releases it; no hip, ankle, claim or history is retained.
