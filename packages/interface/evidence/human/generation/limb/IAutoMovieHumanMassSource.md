# src/human/generation/limb/IAutoMovieHumanMassSource.ts#IAutoMovieHumanMassSource

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanMassSource exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IConnection, IContact, ISeed. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanMassSource; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IConnection, IContact, ISeed contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/limb/IAutoMovieHumanMassSource.ts#IAutoMovieHumanMassSource.IConnection

## @evidence contracts/development/common.md#meaningful-documentation

Actual parent-derived placement, not a central curvature estimate.

## @evidence contracts/development/design.md#principled-representation `parent`: Identical whole-parent fields consumed by the actual parent lofts. `wall`: Original wall at the unchanged public apex Y/Z, mm. `normal`: Anatomical AP outward unit axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanMassSource.seed, AutoMovieHumanMassSource.rebase. Also types AutoMovieHumanTrunkBuild.connection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `rootInterval`: Parent-derived common AP interval for the same footprint, after bounded numerical phase refinement; not an interval certificate. `original`: Exact source before any internal extension, retained for source ownership and comparison. `transfer`: Whether the original supported root was kept or only a new inward prefix was authored.

# src/human/generation/limb/IAutoMovieHumanMassSource.ts#IAutoMovieHumanMassSource.IContact

## @evidence contracts/development/common.md#meaningful-documentation

Actual root-curve point and the same parent chord that supports it.

## @evidence contracts/development/design.md#principled-representation `point`: World point in calibration mm. `chord`: Whole-parent boundary owners, physical stations and phases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanMassSource.originalContact, AutoMovieHumanMassSource.contact.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `point`, `chord`; callers supply the complete record.

# src/human/generation/limb/IAutoMovieHumanMassSource.ts#IAutoMovieHumanMassSource.ISeed

## @evidence contracts/development/common.md#meaningful-documentation

Actual original-parent exit on the declared lower source guide; the final kept atlas still validates this owner.

## @evidence contracts/development/design.md#principled-representation `owner`: Boundary source name consumed by the join's hostFace. `part`: Actual mass chart [physical station mm, phase radians]. `host`: Actual original-parent chart [physical station mm, phase radians].

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanMassSource.seed. Also types AutoMovieHumanBodyTree.seed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `owner`, `part`, `host`, `point`; callers supply the complete record.
