# src/validation/appendMeshTopology.ts#appendMeshTopology

## @evidence contracts/development/implementation.md#principled-implementation

Explicit physical correspondence resolves first and reports named failures; dense finite legacy positions and valid whole-triangle indices then feed canonical coordinate welding and exact/delimited edge keys. Coordinate-collapsed triangles are omitted independently of physical identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Standalone topology and model validation use one edge walk, keeping optional closure distinct from the mandatory incidence/winding rules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

With actual array containers, malformed cardinality or scalar/reference elements yield no topology verdict because model admission reports them; missing position/index slots cannot escape through welding or become invented edges. Container shape is a typed caller premise, and this does not prove triangle area or absence of intersections.

## @evidence contracts/development/common.md#meaningful-documentation

Documents local borrowed buffers, correspondence-first refusal, structural skip, deterministic finding order and expectClosed behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V vertices and T faces, welding and edge population construction take expected O(V+T), followed by O(T) incidence/direction/boundary scans, with O(V+T) maps/rows; diagnostic label work follows emitted findings.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One resolved coordinate weld and physical partition serve every face, while shared edge keys and edge rows accumulate incidence without rebuilding strings on successful edges.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The supplied collector retains only findings, and call-local weld/maps/directions are discarded; mesh buffers are borrowed without mutation and no native mesh resource is acquired.
