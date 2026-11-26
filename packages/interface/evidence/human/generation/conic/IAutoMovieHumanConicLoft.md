# src/human/generation/conic/IAutoMovieHumanConicLoft.ts#IAutoMovieHumanConicLoft.IFamily

## @evidence contracts/development/common.md#meaningful-documentation

The complete authored definition of one part.

## @evidence contracts/development/design.md#principled-representation `name`: Chain name. `centres`: Course centres: the first end, the joints and the last end, mm. `halves`: Half arclength of the turn at each interior centre, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanConicLoft.mirror, AutoMovieHumanConicPose.repose, AutoMovieHumanF1.rounded. Read by AutoMovieHumanConicLoft.axis, AutoMovieHumanConicLoft.reader, AutoMovieHumanConicLoft.part. Also types AutoMovieHumanF1.BODY, AutoMovieHumanF1.CUTTERS.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `roll`: The chart's roll about the course; absent, none. `reliefs`: Reliefs composed onto the wall; absent means none. `tips`: Where the part closes in a point, toward its first knot and toward its last; null leaves that end an open section. `pitch`: Largest distance between two neighbouring phases at the part's widest section, mm; absent, `PHASE_MM`. `phase`: Largest step between neighbouring phases, radians, beside the finest relief net's columns: the mesh's density round the part held apart from its nets'. `turn`: Largest turn of a ring's tangent between two neighbouring phases, radians; absent, the phases are uniform.

# src/human/generation/conic/IAutoMovieHumanConicLoft.ts#IAutoMovieHumanConicLoft.IRoll

## @evidence contracts/development/common.md#meaningful-documentation

States station and angle units, local ease behavior and the fallback natural cubic.

## @evidence contracts/development/design.md#principled-representation

Read each angle at its millimetre knot. Optional millimetre eases bound the support between neighbouring knots, with numeric admission in AutoMovieHumanConicLoft.eased.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanConicPose.twist emits the local roll and AutoMovieHumanConicLoft evaluates both supported laws.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared eases distinguish two laws on a shared knot and value representation. Both produce one angle at every station.

# src/human/generation/conic/IAutoMovieHumanConicLoft.ts#IAutoMovieHumanConicLoft.ITip

## @evidence contracts/development/common.md#meaningful-documentation

One closed end of a part.

## @evidence contracts/development/design.md#principled-representation `from`: Station of the last section the fields own, between the first and the last knot, mm. `tip`: Station of the point, mm. `covered`: The end is not the figure's skin: buried inside another part, as a digit's root inside its limb, or under the digits merged onto it, as a hand's or a foot's closed end.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanConicLoft.[bottom, top], AutoMovieHumanF1.end.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `covered`: The end is not the figure's skin: buried inside another part, as a digit's root inside its limb, or under the digits merged onto it, as a hand's or a foot's closed end. `centre`: The point of the chart, `[u, v]` mm, the cap's sections gather about while it closes, when the end's top does not stand over the course. `own`: Each coordinate of the cap takes the taper and the bend of its own outline at `from`, instead of the mean extent's. `rings`: How many rings the cap is meshed in between its first section and its tip; absent, one at each of its knots (`CAP_KNOTS`).

# src/human/generation/conic/IAutoMovieHumanConicLoft.ts#IAutoMovieHumanConicLoft.ReaderResult

## @evidence contracts/development/common.md#meaningful-documentation

Read the conic family's field vector at station s, measured in millimetres along its course. Field order and units follow the family's section layout.

## @evidence contracts/development/design.md#principled-representation

Read the conic family's field vector at station s, measured in millimetres along its course. Field order and units follow the family's section layout.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanConicLoft.ReaderResult is the canonical exchange used by AutoMovieHumanConicLoft.reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanConicLoft input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.

# src/human/generation/conic/IAutoMovieHumanConicLoft.ts#IAutoMovieHumanConicLoft.INative

## @evidence contracts/development/common.md#meaningful-documentation

Source and reflection functions for a native family generated in one invocation.

## @evidence contracts/development/design.md#principled-representation

The axis and section stations use physical millimetres. Each reader returns the same view-part shape under its declared scope.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanConicLoft delegates source and sampling to these functions, owned by the native family builder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reflected family's producer retains its source clock and derivative scope.
