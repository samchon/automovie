# src/geometry/sweep/poseAutoMovieSurfaceNetwork.ts#poseAutoMovieSurfaceNetwork

## @evidence contracts/development/implementation.md#principled-implementation

Sweep-based deformation applied per sweep, with free curve-network points following their bones rigidly, so the posed network is the same patch layout over moved geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns an ordinary network, so the sampler, tiers and coordinates serve posed surfaces unchanged.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A binding naming nothing in the network is refused rather than ignored.

## @evidence contracts/development/common.md#meaningful-documentation

States what moves and how, what stays, why topology is kept, and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the network's sweeps, nodes, curve points and ring positions, plus each sweep's posing cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call poses one network once; bone rotations are cached by the shared motion lookup.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned network is a new record whose untouched parts are shared with the input.
