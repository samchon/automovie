# src/human/generation/conic/IAutoMovieHumanNativeRadialContact.ts#IAutoMovieHumanNativeRadialContact

## @evidence contracts/development/design.md#principled-representation

An original straight course and source admit a radial crossing of a supplied cutter line.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the frame, host and returned contact read by the Human seed solver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keeps the two world positions distinct, including where a relief changes the host's radial correspondence.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the figure frame, material units and seed scope.

# src/human/generation/conic/IAutoMovieHumanNativeRadialContact.ts#IAutoMovieHumanNativeRadialContact.IHost

## @evidence contracts/development/design.md#principled-representation

The source point and frame share material coordinates and the same physical domain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The solver needs the frame reader, point reader and station domain.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No mesh projection or inferred source extent is supplied.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies station, phase and world units.

# src/human/generation/conic/IAutoMovieHumanNativeRadialContact.ts#IAutoMovieHumanNativeRadialContact.IResult

## @evidence contracts/development/design.md#principled-representation

Carries both actual chart addresses and the corresponding physical observations at the seed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members give both addresses and their distinct world locations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A host point displaced laterally by a relief remains distinct from the cutter point.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the material address ordering, phase interval and spatial units.

# src/human/generation/conic/IAutoMovieHumanNativeRadialContact.ts#IAutoMovieHumanNativeRadialContact.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

States that the frame is the figure-space section frame borrowed from the skin datum readers.

## @evidence contracts/development/design.md#principled-representation

An alias of `IAutoMovieHumanSkinDatum.IFrame`, so the host's section frame and the datum readers' frame are one type with that owner's units and axes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by IAutoMovieHumanSkinDatum. The alias names it for `IHost.at` and for AutoMovieHumanNativeRadialContact, which re-exports it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An alias adds no member and no variant.
