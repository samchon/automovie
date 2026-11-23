# src/sport/TennisMesh.ts#TennisMesh

## @evidence contracts/development/common.md#meaningful-documentation

Names the geometry and the mesh batching boundary.

## @evidence contracts/development/design.md#principled-representation

Local XY paths with rectangular cross sections in XYZ express closed strips for visible strands and tape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One point-path operation serves both equipment producers; each retains its own dimensions and optics.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Does not allocate one model part or collider per strand or fill the air between them.

# src/sport/TennisMesh.ts#TennisMesh.prototype.strip

## @evidence contracts/development/common.md#meaningful-documentation

States all dimensions and the path premise.

## @evidence contracts/development/implementation.md#principled-implementation

Cross sections use the tangent normal through each station. Join corresponding corners with outward-wound triangles and close both ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Emit four vertices per section, then join sequential sections and cap the strip.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bottom and top tape follow the same path. No full panel is emitted between adjacent strips.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the supplied stations, with four vertices per station and eight triangles per segment plus two per cap.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Adjacent segments share the same indexed cross section at a bend.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends to the owned mesh arrays and does not retain input paths.
