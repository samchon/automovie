# src/environments/lifts/liftStopHeights.ts#liftStopHeights

## @evidence contracts/development/implementation.md#principled-implementation

Projects anchor positions onto the rigid shaft basis and checks horizontal residual and axis alignment at 1e-6 m and unit-vector distance. A level's y is a projection, not a nearest-floor search.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve a stop and check the sorted floor intervals. The exterior geometry receives the admitted values.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses contradictory anchor geometry, names and storey heights without changing the supplied placement or car.

## @evidence contracts/development/implementation.md#efficient-algorithms

One anchor lookup per referenced stop, O(N log N) sort and one interval pass for N stops.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Callers place each lift once and owning context supplies the shared anchor lookup.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one sorted row per stop and retains no reference resolver.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the input and output frames and explains stops and their refusal conditions.
