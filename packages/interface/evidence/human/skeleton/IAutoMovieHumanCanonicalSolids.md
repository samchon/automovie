# src/human/skeleton/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanCanonicalSolids exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IJoint, ISolid. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanCanonicalSolids; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IJoint, ISolid contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/skeleton/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.IJoint

## @evidence contracts/development/common.md#meaningful-documentation

One drawn joint at the canonical rest.

## @evidence contracts/development/design.md#principled-representation `parent`: Parent Human joint, or null at the root. `carrier`: The rig bone that carries this joint rigidly. `position`: Rest joint centre, canonical metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanCanonicalSolids.build.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `parent`, `carrier`, `position`, `tip`, `radius`; callers supply the complete record.

# src/human/skeleton/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.ISolid

## @evidence contracts/development/common.md#meaningful-documentation

One convex solid of the body.

## @evidence contracts/development/design.md#principled-representation `id`: Unique shape id: the module's joint, numbered when the module is cut. `carrier`: The rig bone that carries the solid. `centre`: The solid's centroid, canonical metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanCanonicalSolids.build. Also types AutoMovieHumanCanonicalSolids.solids.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `id`, `carrier`, `centre`, `points`, `volume`, `inertia`, `inertiaRotation`; callers supply the complete record.
