# src/geometry/IAutoMovieMeshSeparationAttachment.ts#IAutoMovieMeshSeparationAttachment

## @evidence contracts/development/common.md#meaningful-documentation

Three-vertex fan root registration against a source triangle and its incident support faces at zero requested clearance.

## @evidence contracts/development/design.md#principled-representation

The query interpolates the seat using source coordinates, compares it to the feature root in the selected representation, and checks each listed support contains every positive-weight seat corner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Attachment carries only the seat and support identities. The query owns the resident geometry and computes the possible contact caps.

# src/geometry/IAutoMovieMeshSeparationAttachment.ts#IAutoMovieMeshSeparationAttachment.triangle

## @evidence contracts/development/common.md#meaningful-documentation

Original resident ordinal of the source triangle used to recompute the canonical root seat.

# src/geometry/IAutoMovieMeshSeparationAttachment.ts#IAutoMovieMeshSeparationAttachment.weights

## @evidence contracts/development/common.md#meaningful-documentation

Three finite nonnegative weights in source triangle corner order whose outward sum encloses one. The interpolated seat is rounded to Float32 when that representation was requested.

# src/geometry/IAutoMovieMeshSeparationAttachment.ts#IAutoMovieMeshSeparationAttachment.supports

## @evidence contracts/development/common.md#meaningful-documentation

Nonempty original triangle ordinal sequence including the seat triangle. Each listed triangle must contain every positive-weight seat corner.
