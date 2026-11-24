# src/everyday/HumanGazeLayer.ts#HumanGazeLayer

## @evidence contracts/development/common.md#meaningful-documentation

States request order, onset, return, the hand-over between requests and the returned layer; the layer holds the requests.

## @evidence contracts/development/implementation.md#principled-implementation

The latest request that has begun is aimed over every earlier one still showing, each part's weight its own onset and return times the later requests' remaining share of that part, so at a request's start the posture is the earlier gaze's and it then turns on the saccade's and the head and trunk turns' timings; a request whose return is over shows nothing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Construction declares channels; each apply selects the showing requests, reads each target and its timings once, and aims them in order through `HumanGaze.aim`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The longest turn, read once per layer, bounds every part's turn from the documented timing laws and shares, so the requests it drops show nothing; no target or posture is reused across instants.

## @evidence contracts/development/implementation.md#efficient-algorithms

Construction scans the R requests for channels; each apply finds the latest begun request in O(log R) and aims it, three trunk readings, plus one more aim per earlier request during the longest turn after a later one begins; a finished request costs nothing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The first stage's direction, read once for its timings, is lent to its aim; each stage borrows one local or host-supplied FK workspace.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The layer holds its requests, name and channels only; each apply's workspace and stages end with it.
