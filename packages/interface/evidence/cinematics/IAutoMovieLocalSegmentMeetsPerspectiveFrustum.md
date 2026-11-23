# src/cinematics/IAutoMovieLocalSegmentMeetsPerspectiveFrustum.ts#IAutoMovieLocalSegmentMeetsPerspectiveFrustum.IProps

## @evidence contracts/development/design.md#principled-representation

Endpoints use camera-local metres and -Z viewing depth; tangents and crop coordinates are dimensionless. Numeric validity and crop conversion belong to callers, not this record or the clipping predicate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

World-segment and box frustum consumers share the same local six-plane inputs, allowing the box reader to transform each corner once.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The canonical crop record is reused, and finite-value/boundary-rounding premises remain explicit rather than being presented as a visibility certificate.

## @evidence contracts/development/common.md#meaningful-documentation

Defines axes, units, lens tangents, positive-depth interval, caller validation and inclusive contact.
