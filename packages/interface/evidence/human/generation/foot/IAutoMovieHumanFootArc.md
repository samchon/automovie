# src/human/generation/foot/IAutoMovieHumanFootArc.ts#IAutoMovieHumanFootArc.IJet

## @evidence contracts/development/common.md#meaningful-documentation

A junction's jet in a section's plane.

## @evidence contracts/development/design.md#principled-representation `point`: Place, `[across, up]` mm. `tangent`: Unit tangent in the sense the ring runs. `curvature`: Curvature toward the inside, 1/mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootArc.pieces, AutoMovieHumanFootArc.quintic. Also types AutoMovieHumanFootToeSection.jD, AutoMovieHumanFootToeSection.jR.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `point`, `tangent`, `curvature`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootArc.ts#IAutoMovieHumanFootArc.IPiece

## @evidence contracts/development/common.md#meaningful-documentation

A body section's piece: its name and the two junctions it runs between, in ring order.

## @evidence contracts/development/design.md#principled-representation `name`: The piece's name. `from`: The junction it leaves. `to`: The junction it reaches.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootArc.pieces. Also types AutoMovieHumanFootArc.BODY, AutoMovieHumanFootArc.TOE.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `from`, `to`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootArc.ts#IAutoMovieHumanFootArc.BodyJunction

## @evidence contracts/development/common.md#meaningful-documentation

A junction of a body section, at its guide.

## @evidence contracts/development/design.md#principled-representation

A junction of a body section, at its guide. The closed alternatives are "crest", "lateral", "contactLateral", "contactMedial", "medial".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanFootArc.BODY.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanFootArc.BODY for a junction of a body section, at its guide.

# src/human/generation/foot/IAutoMovieHumanFootArc.ts#IAutoMovieHumanFootArc.ToeJunction

## @evidence contracts/development/common.md#meaningful-documentation

A junction of a toe's section: the dorsal, lateral side, plantar and medial side points.

## @evidence contracts/development/design.md#principled-representation

A junction of a toe's section: the dorsal, lateral side, plantar and medial side points. The closed alternatives are "dorsal", "lateral", "plantar", "medial".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanFootArc.TOE.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanFootArc.TOE for a junction of a toe's section: the dorsal, lateral side, plantar and medial side points.
