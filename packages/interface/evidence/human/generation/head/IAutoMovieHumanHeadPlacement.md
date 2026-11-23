# src/human/generation/head/IAutoMovieHumanHeadPlacement.ts#IAutoMovieHumanHeadPlacement

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanHeadPose exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IShared, IOutput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanHeadPose; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IShared, IOutput contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/head/IAutoMovieHumanHeadPlacement.ts#IAutoMovieHumanHeadPlacement.IShared

## @evidence contracts/development/common.md#meaningful-documentation

One immutable input's common neck owner, before either adjoining original or a part is constructed.

## @evidence contracts/development/design.md#principled-representation `parameters`: Borrowed public input identity; a changed input needs a new source invocation. `inputs`: Same public-to-head input conversion used by the actual head producer. `neckSource`: Registered numerical neck prior, with no part or loft.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadPlacement.IShared belongs to IAutoMovieHumanHeadPlacement; its public declaration is reached by the Human main-entry export closure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `parameters`, `inputs`, `neckSource`, `pose`; callers supply the complete record.

# src/human/generation/head/IAutoMovieHumanHeadPlacement.ts#IAutoMovieHumanHeadPlacement.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Direct generating facts; no head source, raw chain or complete calibration is retained.

## @evidence contracts/development/design.md#principled-representation `neck`: Original neck declaration with its real selected placement, in calibration mm. `places`: Existing numerical placement laws, together with this identical neck declaration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadPose.create. Read by AutoMovieHumanHeadLane.prepare. Also types AutoMovieHumanBodySources.pose, AutoMovieHumanHeadLane.pose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `neck`, `places`; callers supply the complete record.
