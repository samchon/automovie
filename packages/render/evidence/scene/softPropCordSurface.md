# src/scene/softPropCordSurface.ts#softPropCordSurface

## @evidence contracts/development/common.md#meaningful-documentation

States the source, coordinate frame and tube sampling rule.

## @evidence contracts/development/implementation.md#principled-implementation

TubeGeometry transports its frame along a path parameterized by particle index, preserving nonuniform particle spacing in the ring centres up to Float32 conversion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The path defines the parameterization and tangents. Three.js owns ring construction, winding, normals and UVs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The radius is the caller's in metres, and the radial tessellation is Three.js's default. Missing or unrepresentable coordinates and nonfinite tube output are refused. Consecutive identical points share a ring; a point-only configuration has no tube.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in particles and the SDK's fixed radial segments. Adjacent coincident points are removed once and all path samples use direct index addressing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The geometry represents one frame's particle positions, with no assumption that another frame has the same points.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Disposes the temporary buffer geometry after copying its attributes; the result retains only plain arrays and its extent.
