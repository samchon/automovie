# src/furniture/AutoMovieArchetypeSeat.ts#AutoMovieArchetypeSeat.create

## @evidence contracts/development/common.md#meaningful-documentation

The contract states the floor origin, front-edge seat frame, optional numeric draw, per-kind contacts and default shared-place count. The runnable numeric example uses an ordinary dining seat.

## @evidence contracts/development/implementation.md#principled-implementation

The chosen band supplies seat height, depth and per-place width. The seat collider's top supplies the front-edge seat frame. Optional back, arms, bar and lying surface follow the emitted parts. Bench and sofa use one contact over the combined width. Round seats describe a rectangular site envelope around their physical disc.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw session resolves applicable dimensions. The factory emits a fixed number of support parts for each kind and scales the shared surface width instead of constructing a separate object for each place. All temporary dimensions and builder parts belong to the call.

# src/furniture/AutoMovieArchetypeSeat.ts#AutoMovieArchetypeSeat.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The type identifies the seven shapes and the kind-specific controls.

## @evidence contracts/development/design.md#principled-representation

The saved kind chooses a band table, physical support layout and contact set. The public factory validates membership before constructing geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One kind drives the producer, bands and public alternatives. It gives an author a shape and contact contract without separate geometry controls.

# src/furniture/AutoMovieArchetypeSeat.ts#AutoMovieArchetypeSeat.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Lists each saved kind that the factory accepts.

# src/furniture/AutoMovieArchetypeSeat.ts#AutoMovieArchetypeSeat.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

States which kinds expose a sitting surface, a back and pull grip, armrests, bar footrest and lying surface.

## @evidence contracts/development/design.md#principled-representation

Every model emits the seat. A back band enables both the rear face and its grip. An arm band enables the two armrests. Only bar stools create a footrest and only shared forms generate a lying contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The type provides the vocabulary used by generated models and motion lookup. The produced model resolves which of those contact names are present.

# src/furniture/AutoMovieArchetypeSeat.ts#AutoMovieArchetypeSeat.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Separates geometric metres from kilograms per place. Describes the stool's derived depth, relative pad heights and bar drop.

## @evidence contracts/development/design.md#principled-representation

The individual kind's table owns applicability and bounds. The draw session checks fixed scalars against that table. Shared seat width and mass multiply the per-place figures while stool depth follows its diameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same dimension IDs name overrides and their provenance on the returned model. Motion callers use the actual seat or rest dimensions on the emitted affordances.

# src/furniture/AutoMovieArchetypeSeat.ts#AutoMovieArchetypeSeat.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Declares lengths in metres and per-place mass in kilograms for the caller-facing provenance.

# src/furniture/AutoMovieArchetypeSeat.ts#AutoMovieArchetypeSeat.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Documents the supported kind, default scene ID, place bounds and per-kind dimension choices.

## @evidence contracts/development/design.md#principled-representation

Place count is admitted from the selected layout's discrete values. Omitted coordinates use the producer's draw. Banded overrides keep their documented units and reuse the selected kind's admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameter record gives only the variant, scene identity, place count and band choices. It shares dimension keys with the output's provenance.

# src/furniture/AutoMovieArchetypeSeat.ts#AutoMovieArchetypeSeat.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

The selected kind supplies the dimensions and available scene contacts.

# src/furniture/AutoMovieArchetypeSeat.ts#AutoMovieArchetypeSeat.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The generated model retains the supplied scene ID or defaults to the seat family name.

# src/furniture/AutoMovieArchetypeSeat.ts#AutoMovieArchetypeSeat.IParams.places

## @evidence contracts/development/common.md#meaningful-documentation

Bench and sofa default to two and admit whole counts from one to four. Other kinds have one place. Expanded width and body mass follow that count.

# src/furniture/AutoMovieArchetypeSeat.ts#AutoMovieArchetypeSeat.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Publishes each kind's measured or provisional choices with the owner units. Reproducible draws and fixed parameter admission use the same table.
