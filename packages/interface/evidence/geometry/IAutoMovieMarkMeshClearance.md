# src/geometry/IAutoMovieMarkMeshClearance.ts#IAutoMovieMarkMeshClearance.IProps

## @evidence contracts/development/design.md#principled-representation

The mesh and witness gap share metre coordinates; anchor selects the object-local frame or null for world space.

## @evidence contracts/development/design.md#minimal-and-owned-surface

markAutoMovieMeshClearance consumes measurement witnesses and produces IAutoMovieMark segments without mutating source buffers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Witness lengths and front vertex bounds are checked; finite mesh values, weights, gaps and a matching measurement axis remain caller premises.

## @evidence contracts/development/common.md#meaningful-documentation

Inputs for turning directional clearance witnesses into inspection segments. The mesh and witness gap share metre coordinates; anchor selects the object-local frame or null for world space.
