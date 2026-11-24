# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1

## @evidence contracts/development/common.md#meaningful-documentation

Reference-family assembly, cutters and digit connection seams in the figure's registered frame. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IPiece, IMember, IDigit, IAssembly, IConstruction, IBody, Cutters, IRailMm, ValleyJoints, ValleyResult, IFanSeamsResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IPiece, IMember, IDigit, IAssembly, IConstruction, IBody, Cutters, IRailMm, ValleyJoints, ValleyResult, IFanSeamsResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanF1 exchanges the named IPiece, IMember, IDigit, IAssembly, IConstruction, IBody, Cutters, IRailMm, ValleyJoints, ValleyResult, IFanSeamsResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.IPiece

## @evidence contracts/development/common.md#meaningful-documentation

One generated surface piece.

## @evidence contracts/development/design.md#principled-representation `name`: `body` for the sewn skin, else a digit's chain name, with `.mirror` for the reflected twin. `positions`: Vertex positions, three per vertex, metres in the figure's frame (forward +X, up +Y, left +Z). `indices`: Triangle indices, counter-clockwise seen from outside.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanF1.create. Also types AutoMovieHumanF1.pieces.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `positions`, `indices`, `diagnostics`; callers supply the complete record.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.IMember

## @evidence contracts/development/common.md#meaningful-documentation

One authored family in the figure.

## @evidence contracts/development/design.md#principled-representation `family`: The authored definition. `mirrored`: Present a second time as its twin across the median plane `z = 0`. `reach`: How far a loose family is carried before its first knot and past its last, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by markHumanCaptureCurves. Also types AutoMovieHumanF1.LOOSE, AutoMovieHumanF1.FAMILIES.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `reach`: How far a loose family is carried before its first knot and past its last, mm.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.IDigit

## @evidence contracts/development/common.md#meaningful-documentation

One digit sewn to its limb.

## @evidence contracts/development/design.md#principled-representation `family`: The digit's authored definition. `limb`: The limb whose cap it leaves through. `knuckle`: The digit leaves its limb's end over a knuckle in the row of knuckles, as one of the children of the end's split (`FANS`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanF1.DIGITS, AutoMovieHumanF1.digits.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `family`, `limb`, `knuckle`; callers supply the complete record.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.IAssembly

## @evidence contracts/development/common.md#meaningful-documentation

Every family of the figure placed at a pose (`assemble`).

## @evidence contracts/development/design.md#principled-representation `frames`: Every segment's frame at the pose, in the figure's frame. `body`: `BODY` at the pose. `digits`: `DIGITS` at the pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanF1.assemble. Read by AutoMovieHumanF1.trunkChart, AutoMovieHumanF1.armscye, AutoMovieHumanF1.nostril. Also types AutoMovieHumanF1.placed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frames`, `body`, `digits`, `helix`, `antihelix`, `axilla`, `concha`, `nostril`, `families`, `station`, `point`, `direction`; callers supply the complete record.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.IConstruction

## @evidence contracts/development/common.md#meaningful-documentation

The sewn body's declaration: its construction tree and the view parts its source leaves name.

## @evidence contracts/development/design.md#principled-representation `root`: The tree: both arm ports over the crotch split over the trunk. `sources`: The complete source part of each named leaf, borrowed immutably for its readers' lifetime. `fills`: The skin's discs faired once it is drawn (`IAutoMovieConstruction.fills`), metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanF1.construction. Also types AutoMovieHumanF1.declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `root`, `sources`, `fills`; callers supply the complete record.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.IBody

## @evidence contracts/development/common.md#meaningful-documentation

The families the sewn body is built from.

## @evidence contracts/development/design.md#principled-representation `trunk`: Original conic family for the trunk, in the registered reference frame and calibration millimetres. `arm`: Original conic family for the arm, in the registered reference frame and calibration millimetres. `hand`: Original conic family for the hand, in the registered reference frame and calibration millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanF1.IBody is the canonical exchange used by AutoMovieHumanF1.BODY.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `trunk`, `arm`, `hand`, `leg`, `ear`, `nose`, `breast`; callers supply the complete record.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.Cutters

## @evidence contracts/development/common.md#meaningful-documentation

Every stored cutter of the figure: the armpit's slit, each ear's bowl and each nostril are lofts cut out of the skin (`construction`), so `FAMILIES` does not hold them.

## @evidence contracts/development/design.md#principled-representation

Every stored cutter of the figure: the armpit's slit, each ear's bowl and each nostril are lofts cut out of the skin (`construction`), so `FAMILIES` does not hold them. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanF1.Cutters is the canonical exchange used by AutoMovieHumanF1.CUTTERS.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanF1.CUTTERS for every stored cutter of the figure: the armpit's slit, each ear's bowl and each nostril are lofts cut out of the skin (`construction`), so `FAMILIES` does not hold them.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.IRailMm

## @evidence contracts/development/common.md#meaningful-documentation

Where each limb's band lands on it, mm from the limb's first station: the limb keeps its stations beyond.

## @evidence contracts/development/design.md#principled-representation `arm`: Physical connection-band rail reach for the arm, millimetres. `leg`: Physical connection-band rail reach for the leg, millimetres. `breast`: Physical connection-band rail reach for the breast, millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanF1.IRailMm is the canonical exchange used by AutoMovieHumanF1.RAIL_MM.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `arm`, `leg`, `breast`; callers supply the complete record.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.ValleyJoints

## @evidence contracts/development/common.md#meaningful-documentation

Where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`.

## @evidence contracts/development/design.md#principled-representation

Where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanF1.ValleyJoints is the canonical exchange used by AutoMovieHumanF1.valley.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanF1.valley for where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.ValleyResult

## @evidence contracts/development/common.md#meaningful-documentation

Where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`.

## @evidence contracts/development/design.md#principled-representation

Where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanF1.ValleyResult is the canonical exchange used by AutoMovieHumanF1.valley.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanF1.valley for where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.IFanSeamsResult

## @evidence contracts/development/common.md#meaningful-documentation

The seams a limb's open end is split along between its knuckled digits (`IAutoMovieConstructionSplit.outer`), from the little finger's or the little toe's valley inward, each a pair of host phases on the end's ring enclosing the one before; each seam's heading, toward the middle of the gap between the two digits' facing skins (`IAutoMovieConstructionSplit.IProfile.heading`); and the end's station, outward normal and palm or sole normal.

## @evidence contracts/development/design.md#principled-representation `station`: Physical station along this part's declared source axis, millimetres. `seams`: Pairs of host section phases in radians, enclosing each preceding seam from the outermost digit valley inward. `headings`: Unit headings from each host seam toward the gap between its neighbouring digit skins, in the registered frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanF1.IFanSeamsResult is the canonical exchange used by AutoMovieHumanF1.fanSeams.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `station`, `seams`, `headings`, `normal`, `up`; callers supply the complete record.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.IRootControls

## @evidence contracts/development/common.md#meaningful-documentation

The assembly's original parent-chart radial controls.

## @evidence contracts/development/design.md#principled-representation

Arms and breasts have a loop per side, and the nose has one loop. Each loop uses its host-chart metres and radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanF1 and native root preparation read these controls before constructing ports.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The two loops distinguish anatomical sides without assigning another clock to either.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.IRootSection

## @evidence contracts/development/common.md#meaningful-documentation

A child conic family's skin cut on its parent's last section plane.

## @evidence contracts/development/design.md#principled-representation

Plane vectors use figure coordinates with a millimetre origin. The child's centre and sampled closed contour use millimetres in the plane chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanF1.rootSection returns this section for fitter and join diagnostics.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This records the sampled skin intersection and its plane. The operator owns admission of the continuous joint.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.IConstructionWithNails

## @evidence contracts/development/common.md#meaningful-documentation

The nails are fitted once for the already placed +Z digits before their beds enter the source tree.

## @evidence contracts/development/design.md#principled-representation

The assembled tree and the immutable nail records have the same invocation and authored digit identities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Production and capture share these records. Source-only preparation reads IConstruction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A production declaration supplies the records that generated its beds.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.IConstructionWithContacts

## @evidence contracts/development/design.md#principled-representation

Each actual F1 declaration owns its immutable source bank and the +Z attachment producers that consume it.

## @evidence contracts/development/common.md#meaningful-documentation

The aggregate prepares all named contacts before a later operator may require their seeds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanF1's construction builders and extended by IConstructionWithNails. It adds one deferred reader to IConstruction, so the premises are prepared only when asked for.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The `contactPremises` reader is produced by AutoMovieHumanF1 for every authored side attachment, and its only current reader is the reference capture under `test/src/reference-conics`, which refuses a capture on a refused premise; no production package reads it yet.

# src/human/generation/f1/IAutoMovieHumanF1.ts#IAutoMovieHumanF1.IContactPremise

## @evidence contracts/development/design.md#principled-representation

A discriminated record binds the real host and child face names to the prepared chart or its first named refusal.

## @evidence contracts/development/common.md#meaningful-documentation

Gap is measured in mm at the preparing producer's sample scope. Preparation does not certify final rails, trim or the reference surface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `IConstructionWithContacts.contactPremises`. The node name and the two face names identify the attachment; the prepared branch carries the gap and the sampled column count, the refused branch its first unavailable premise.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The two outcomes are a union discriminated by `kind`, so a refusal carries no gap and a prepared contact no detail. Its only current reader is the reference capture under `test/src/reference-conics`; no production package reads it yet.
