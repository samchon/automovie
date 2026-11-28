# src/geometry/IAutoMovieMeasureMeshDefects.ts#IAutoMovieMeasureMeshDefects.IMesh

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed packed XYZ positions and optional explicit triangle indices, using one coordinate frame and unit. Use finite weld-scaled coordinates and whole in-range indices.

## @evidence contracts/development/design.md#principled-representation

The measure reads indexed corners or successive vertex triples, rounds coordinates to lattice cells for incidence, and can measure aspect in stored coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The measure input admits typed arrays and a null index buffer. It needs neither normals, UVs nor rendering metadata.

# src/geometry/IAutoMovieMeasureMeshDefects.ts#IAutoMovieMeasureMeshDefects.IMesh.positions

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed xyz components, three per vertex. Every coordinate must have a finite lattice product to describe a usable cell.

# src/geometry/IAutoMovieMeasureMeshDefects.ts#IAutoMovieMeasureMeshDefects.IMesh.indices

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed zero-based whole triangle corner ordinals or null for consecutive triples of vertices. Empty buffers describe an empty mesh.

# src/geometry/IAutoMovieMeasureMeshDefects.ts#IAutoMovieMeasureMeshDefects.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

Positional lattice resolution and an optional dimensionless triangle aspect threshold. Supply finite positive values.

## @evidence contracts/development/design.md#principled-representation

Coordinate rounding creates identity before incidence measurement. Sliver comparison uses the ratio of longest stored edge to its altitude.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Welding and sliver policy belong to the call options. They stay independent of the mesh buffers and output defect classification.

# src/geometry/IAutoMovieMeasureMeshDefects.ts#IAutoMovieMeasureMeshDefects.IOptions.weld

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite lattice cells per coordinate unit. Omission uses 1e9, corresponding to a nanometre grid for metre positions.

# src/geometry/IAutoMovieMeasureMeshDefects.ts#IAutoMovieMeasureMeshDefects.IOptions.sliver

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite dimensionless longest-edge-to-altitude threshold. Omission disables sliver classification.
