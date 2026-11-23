# src/geometry/construction/regionAutoMovieSolidMesh.ts#regionAutoMovieSolidMesh

## @evidence contracts/development/implementation.md#principled-implementation

Shewchuk's region spreading across non-segment edges, computed as connected components by union-find over shared side identities; the premise is the planner's, that constraints bound every change of membership.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Topology only: the planner owns sampling the residual membership and its refusal, so this owner neither calls the membership nor reads a coordinate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Joins nothing across a constraint and infers no adjacency from coincident coordinates; a side held by more than two triangles joins them all, and the planner's own incidence checks own that refusal.

## @evidence contracts/development/common.md#meaningful-documentation

States the region definition, its literature basis, the side identity, the label convention and the nonmanifold behaviour.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the 3T sides with a map of side identities and union by least index with path halving: O(T + S) keys and near-linear union work for T triangles and S constraints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure call-local labelling that coordinates no requests or phases.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The side map, constraint set and parent array are call-local O(T + S); only the returned label array survives, owned by the caller.
