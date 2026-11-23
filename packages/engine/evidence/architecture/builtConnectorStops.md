# src/architecture/builtConnectorStops.ts#builtConnectorStops

## @evidence contracts/development/implementation.md#principled-implementation

A concatenation of the authored endpoints and landings, which is the connector's own statement of where it stops; it relies on landings being in route order, which validation enforces, and does not re-sort them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One list shared by adjacency, connector lookup and the census instead of three private copies, so the meaning of a stop has one owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Treats every connector kind alike and adds no inferred stop; a run that declares no landing has exactly its two ends.

## @evidence contracts/development/common.md#meaningful-documentation

States the stop order, that every landing is a stop, that landings keep their declared order, and which queries share the list.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the landing count, building one array of stop ids per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pure projection of one record that coordinates no work; callers that need it repeatedly per connector call it once per connector.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned array, bounded by the landing count plus two.
