# src/core/AutoMovieArchetypeSite.ts#AutoMovieArchetypeSite.at

## @evidence contracts/development/common.md#meaningful-documentation

The documentation gives both midpoint defaults, the finite numeric interval and the resulting parent frame. It states which extents and axes each contact uses and describes the wheel's tangent and normal.

## @evidence contracts/development/implementation.md#principled-implementation

The reader validates both numeric coordinates before branching on contact kind. A finite extent maps the requested share to its declared local axis. An omitted extent contributes zero on that axis. The wheel rotates its radius and derives a tangent frame from the same angle. The rigid frame moves these local points to the affordance's parent space.

## @evidence contracts/development/implementation.md#efficient-algorithms

The operation checks two scalars and constructs only the selected site. A wheel uses one quaternion turn and a tangent basis. Returned coordinate records belong to the call.
