# src/cinematics/IAutoMovieLocalSegmentMeetsPerspectiveFrustum.ts#IAutoMovieLocalSegmentMeetsPerspectiveFrustum

## @evidence contracts/development/design.md#principled-representation

IProps names local endpoints, metre-valued depths and dimensionless lens/crop scalars; numerical validity remains a caller premise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared local predicate serves world-segment and box-frustum readers without repeated corner transformation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Canonical vector and crop contracts are reused, and geometric intersection is not presented as rendered visibility.

## @evidence contracts/development/common.md#meaningful-documentation

IProps records axis convention, inclusive planes and representability assumptions.

# src/cinematics/IAutoMovieLocalSegmentMeetsPerspectiveFrustum.ts#IAutoMovieLocalSegmentMeetsPerspectiveFrustum.IProps

## @evidence contracts/development/design.md#principled-representation

Endpoints use camera-local metres and -Z viewing depth; tangents and crop coordinates are dimensionless. Numeric validity and crop conversion belong to callers, not this record or the clipping predicate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

World-segment and box frustum consumers share the same local six-plane inputs, allowing the box reader to transform each corner once.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The canonical crop record is reused, and finite-value/boundary-rounding premises remain explicit rather than being presented as a visibility certificate.

## @evidence contracts/development/common.md#meaningful-documentation

Defines axes, units, lens tangents, positive-depth interval, caller validation and inclusive contact.
