# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.ITransform

## @evidence contracts/development/common.md#meaningful-documentation

Rigid transform of a child frame into its parent: a child point `p` lies at `origin + axes[0] * p[0] + axes[1] * p[1] + axes[2] * p[2]` in the parent.

## @evidence contracts/development/design.md#principled-representation `origin`: Child origin in parent coordinates. `axes`: Child X, Y and Z axes in parent coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmCurveSpec.compose, AutoMovieHumanArmCurveSpec.inverse. Read by AutoMovieHumanArmCurveSpec.apply, AutoMovieHumanArmCurveSpec.rotate, AutoMovieHumanArmCurveSpec.compose. Also types AutoMovieHumanArmCurveSpec.IDENTITY.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `origin`, `axes`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.ISource

## @evidence contracts/development/common.md#meaningful-documentation

Where a datum's value comes from.

## @evidence contracts/development/design.md#principled-representation

Where a datum's value comes from. Alternatives are a record with kind, field; a record with kind, citation, detail; a record with kind, rule; a record with kind, reason.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmCurveSpec.ISource is the canonical exchange used by IAutoMovieHumanArmCurveSpec.ISegmentFrame, IAutoMovieHumanArmCurveSpec.IDatum, IAutoMovieHumanArmCurveSpec.IConstraint.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by IAutoMovieHumanArmCurveSpec.ISegmentFrame, IAutoMovieHumanArmCurveSpec.IDatum, IAutoMovieHumanArmCurveSpec.IConstraint for where a datum's value comes from.

# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.ISegmentFrame

## @evidence contracts/development/common.md#meaningful-documentation

One ISB-style segment frame, relative to its parent frame.

## @evidence contracts/development/design.md#principled-representation `name`: Frame name, e.g. `parent`: Parent frame name; `null` for the root that receives a trunk transform. `basis`: Origin datum and axis definition, with citation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmCurveSpec.ISegmentFrame belongs to IAutoMovieHumanArmCurveSpec; its public declaration is reached by the Human main-entry export closure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `parent`, `basis`, `relative`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.IDatum

## @evidence contracts/development/common.md#meaningful-documentation

A named point expressed in one frame.

## @evidence contracts/development/design.md#principled-representation `name`: Datum name. `frame`: Frame the coordinates are expressed in. `point`: Local coordinates, calibration mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmCurveSpec.IDatum is the canonical exchange used by IAutoMovieHumanArmCurveSpec.ICurveSpec.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `frame`, `point`, `source`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.IConstraint

## @evidence contracts/development/common.md#meaningful-documentation

A constraint the constructed curve must satisfy, checked independently of the constructor.

## @evidence contracts/development/design.md#principled-representation

A constraint the constructed curve must satisfy, checked independently of the constructor. Alternatives are a record with kind, datum; a record with kind, origin, normal; a record with kind, length, source; a record with kind, direction, length, source; a record with kind, neighbour, order; a record with kind, datum, direction; a record with kind, datum, axis, sense, value, interval; a record with kind, axis, sense, interval; a record with kind, normal, sign, interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmCurveSpec.IConstraint is the canonical exchange used by IAutoMovieHumanArmCurveSpec.ICurveSpec.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by IAutoMovieHumanArmCurveSpec.ICurveSpec for a constraint the constructed curve must satisfy, checked independently of the constructor.

# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.IEllipse

## @evidence contracts/development/common.md#meaningful-documentation

Closed section representation: an ellipse in its plane.

## @evidence contracts/development/design.md#principled-representation `kind`: Representation tag. `centre`: Centre, local frame. `u`: First unit in-plane axis, local frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmCurveSpec.IEllipse is the canonical exchange used by IAutoMovieHumanArmCurveSpec.ICurveSpec.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `kind`, `centre`, `u`, `v`, `a`, `b`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.IOutlineKnot

## @evidence contracts/development/common.md#meaningful-documentation

One knot of a scalar view outline (classic conic lofting's longitudinal control line): the signed chart offset, or the conic shoulder, at a station, with its first and second derivatives in the outline's own source parameter `q` (not in station unless the parameter is the station).

## @evidence contracts/development/design.md#principled-representation `site`: Site name, such as `elbow` or `bottom pole`. `station`: Station along the segment's own axis from its own zero (the segment's proximal datum), calibration mm; `IOutline.walk + station` is the walk station. `q`: Source parameter value at the station, in the unit `IOutline.parameter` names.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmCurveSpec.IOutlineKnot is the canonical exchange used by IAutoMovieHumanArmCurveSpec.IOutline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `site`, `station`, `q`, `value`, `first`, `second`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.IOutline

## @evidence contracts/development/common.md#meaningful-documentation

A scalar view outline: a C2 quintic Hermite chain in the source parameter, one value per station, read by the engine as one signed edge of the section box or as the conic shoulder (rho) fullness law.

## @evidence contracts/development/design.md#principled-representation `kind`: Representation tag. `parameter`: Meaning and unit of `q`, such as the engine's two-pole angle parameter. `direction`: Unit direction the value measures along at neutral, spec frame; null for a dimensionless fullness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmCurveSpec.IOutline is the canonical exchange used by IAutoMovieHumanArmCurveSpec.ICurveSpec.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `kind`, `parameter`, `direction`, `walk`, `domain`, `knots`, `handleRule`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.IConicLoop

## @evidence contracts/development/common.md#meaningful-documentation

A closed conic section (classic conic lofting): four quarter conics on a box about the axis, each from one guide to the next with tangents along the box sides and its shoulder `rho` the share of the corner diagonal from the chord's midpoint to the corner (`AutoMovieViewSection`).

## @evidence contracts/development/design.md#principled-representation `kind`: Representation tag. `station`: Station of the loop on the walk course, calibration mm. `extents`: Half extents along the engine chart's +u, +v, -u, -v, calibration mm, all positive.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmCurveSpec.IConicLoop is the canonical exchange used by IAutoMovieHumanArmCurveSpec.ICurveSpec.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `kind`, `station`, `extents`, `shoulders`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.IAid

## @evidence contracts/development/common.md#meaningful-documentation

A construction aid drawn beside, never inside, the anatomical curves: a polyline in its frame.

## @evidence contracts/development/design.md#principled-representation `kind`: Drafting role. `name`: Aid name, such as `tangent anterior at elbow`. `frame`: Frame the points are written in.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmCurveSpec.IAid is the canonical exchange used by IAutoMovieHumanArmCurveSpec.ICurveSpec.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `kind`, `name`, `frame`, `points`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.IBezierChain

## @evidence contracts/development/common.md#meaningful-documentation

Piecewise cubic Bézier chain in the spec's frame, calibration mm.

## @evidence contracts/development/design.md#principled-representation `kind`: Representation tag. `points`: On-curve points and handles in the layout above, spec frame, calibration mm. `closed`: Whether the last span returns to `points[0]`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmCurveSpec.bezierPoint, AutoMovieHumanArmCurveSpec.bezierSpans.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `kind`, `points`, `closed`, `handleRule`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.IHermiteKnot

## @evidence contracts/development/common.md#meaningful-documentation

One knot of a quintic Hermite chain: position and the first and second derivatives with respect to the chain's own parameter `q`, spec frame.

## @evidence contracts/development/design.md#principled-representation `q`: Parameter value; strictly increasing along the chain, in the unit `IQuinticHermite.parameter` names. `position`: Position, calibration mm. `first`: dP/dq, calibration mm per parameter unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmCurveSpec.quinticControls. Also types AutoMovieHumanArmCurveSpec.k.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `q`, `position`, `first`, `second`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.IQuinticHermite

## @evidence contracts/development/common.md#meaningful-documentation

Quintic Hermite chain: each span between consecutive knots is the polynomial quintic fixed by both endpoints' positions, first and second derivatives in `q`, so the chain is C2 in `q` across its knots.

## @evidence contracts/development/design.md#principled-representation `kind`: Representation tag. `parameter`: Meaning and unit of `q`, e.g. `knots`: Knots in increasing `q`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmCurveSpec.quinticPoint.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `kind`, `parameter`, `knots`, `handleRule`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmCurveSpec.ts#IAutoMovieHumanArmCurveSpec.ICurveSpec

## @evidence contracts/development/common.md#meaningful-documentation

One original curve specification.

## @evidence contracts/development/design.md#principled-representation `name`: Curve name. `frame`: Frame its datums and representation are written in. `datums`: Datums it reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmCurveSpec.ICurveSpec belongs to IAutoMovieHumanArmCurveSpec; its public declaration is reached by the Human main-entry export closure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `frame`, `datums`, `constraints`, `representation`, `aids`, `consumers`; callers supply the complete record.
