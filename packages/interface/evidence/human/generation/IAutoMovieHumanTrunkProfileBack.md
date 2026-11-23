# src/human/generation/IAutoMovieHumanTrunkProfileBack.ts#IAutoMovieHumanTrunkProfileBack

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanTrunkProfileBack exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IProfile, ApexesLumbar, ApexesThoracic, ApexesResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanTrunkProfileBack; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IProfile, ApexesLumbar, ApexesThoracic, ApexesResult contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanTrunkProfileBack.ts#IAutoMovieHumanTrunkProfileBack.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

The profile.

## @evidence contracts/development/design.md#principled-representation `at`: The forward place of the back midline at a height, mm. `marks`: The landmark stations the profile runs through, `[height, forward place]`, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkProfileBack.create. Read by AutoMovieHumanTrunkProfileBack.apexes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `at`, `marks`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanTrunkProfileBack.ts#IAutoMovieHumanTrunkProfileBack.ApexesLumbar

## @evidence contracts/development/common.md#meaningful-documentation

The heights of the lordosis' and the kyphosis' apexes on a profile: the most anterior and the most posterior point of the back's midline between two heights, scanned every 2 mm.

## @evidence contracts/development/design.md#principled-representation

The heights of the lordosis' and the kyphosis' apexes on a profile: the most anterior and the most posterior point of the back's midline between two heights, scanned every 2 mm. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkProfileBack.ApexesLumbar is the canonical exchange used by AutoMovieHumanTrunkProfileBack.apexes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkProfileBack.apexes for the heights of the lordosis' and the kyphosis' apexes on a profile: the most anterior and the most posterior point of the back's midline between two heights, scanned every 2 mm.

# src/human/generation/IAutoMovieHumanTrunkProfileBack.ts#IAutoMovieHumanTrunkProfileBack.ApexesThoracic

## @evidence contracts/development/common.md#meaningful-documentation

The heights of the lordosis' and the kyphosis' apexes on a profile: the most anterior and the most posterior point of the back's midline between two heights, scanned every 2 mm.

## @evidence contracts/development/design.md#principled-representation

The heights of the lordosis' and the kyphosis' apexes on a profile: the most anterior and the most posterior point of the back's midline between two heights, scanned every 2 mm. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkProfileBack.ApexesThoracic is the canonical exchange used by AutoMovieHumanTrunkProfileBack.apexes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkProfileBack.apexes for the heights of the lordosis' and the kyphosis' apexes on a profile: the most anterior and the most posterior point of the back's midline between two heights, scanned every 2 mm.

# src/human/generation/IAutoMovieHumanTrunkProfileBack.ts#IAutoMovieHumanTrunkProfileBack.ApexesResult

## @evidence contracts/development/common.md#meaningful-documentation

The heights of the lordosis' and the kyphosis' apexes on a profile: the most anterior and the most posterior point of the back's midline between two heights, scanned every 2 mm.

## @evidence contracts/development/design.md#principled-representation

The heights of the lordosis' and the kyphosis' apexes on a profile: the most anterior and the most posterior point of the back's midline between two heights, scanned every 2 mm. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkProfileBack.ApexesResult is the canonical exchange used by AutoMovieHumanTrunkProfileBack.apexes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkProfileBack.apexes for the heights of the lordosis' and the kyphosis' apexes on a profile: the most anterior and the most posterior point of the back's midline between two heights, scanned every 2 mm.
