# src/geometry/IAutoMovieTriangleAttachmentContactBound.ts#IAutoMovieTriangleAttachmentContactBound

## @evidence contracts/development/common.md#meaningful-documentation

Conservative extent of contact between a complete anchored fan and one support triangle.

## @evidence contracts/development/design.md#principled-representation

Outward projections bound the support slab, root deficit and smaller non-root corner gap. The cap bounds contact when both non-root corners lie strictly above that slab.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The bound reports the proof outcome and supporting projection quantities. Root registration and other-face separation belong to the caller.

# src/geometry/IAutoMovieTriangleAttachmentContactBound.ts#IAutoMovieTriangleAttachmentContactBound.proved

## @evidence contracts/development/common.md#meaningful-documentation

True when the slab gap proves that the reported cap encloses every possible fan contact on the support.

# src/geometry/IAutoMovieTriangleAttachmentContactBound.ts#IAutoMovieTriangleAttachmentContactBound.cap

## @evidence contracts/development/common.md#meaningful-documentation

Outward upper distance bound in metres from the root to any possible contact. The zero in an unproved receipt carries no contact bound.

# src/geometry/IAutoMovieTriangleAttachmentContactBound.ts#IAutoMovieTriangleAttachmentContactBound.cornerGap

## @evidence contracts/development/common.md#meaningful-documentation

Outward lower enclosure of the smaller non-root corner height above the slab top, in scaled projection units.

# src/geometry/IAutoMovieTriangleAttachmentContactBound.ts#IAutoMovieTriangleAttachmentContactBound.rootDeficit

## @evidence contracts/development/common.md#meaningful-documentation

Outward upper enclosure of the nonnegative deficit from the root to the slab top, in the same scaled projection units.
