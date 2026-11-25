# src/human/generation/IAutoMovieHumanTrunkQuadrant.ts#IAutoMovieHumanTrunkQuadrant.Side

## @evidence contracts/development/common.md#meaningful-documentation

A side of the section.

## @evidence contracts/development/design.md#principled-representation

A side of the section. The closed alternatives are "front", "back".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmRootArc.share, AutoMovieHumanTrunkCourses.point, AutoMovieHumanTrunkFeatures.phaseAt.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanArmRootArc.share, AutoMovieHumanTrunkCourses.point, AutoMovieHumanTrunkFeatures.phaseAt, AutoMovieHumanTrunkQuadrant.depth for a side of the section.

# src/human/generation/IAutoMovieHumanTrunkQuadrant.ts#IAutoMovieHumanTrunkQuadrant.BaseResult

## @evidence contracts/development/common.md#meaningful-documentation

The base point of a side at a lateral share, before the displacements.

## @evidence contracts/development/design.md#principled-representation

The base point of a side at a lateral share, before the displacements. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkQuadrant.BaseResult is the canonical exchange used by AutoMovieHumanTrunkQuadrant.base.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkQuadrant.base for the base point of a side at a lateral share, before the displacements.

# src/human/generation/IAutoMovieHumanTrunkQuadrant.ts#IAutoMovieHumanTrunkQuadrant.SectorSpeeds

## @evidence contracts/development/common.md#meaningful-documentation

The jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian.

## @evidence contracts/development/design.md#principled-representation

The jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkQuadrant.SectorSpeeds is the canonical exchange used by AutoMovieHumanTrunkQuadrant.sector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkQuadrant.sector for the jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian.

# src/human/generation/IAutoMovieHumanTrunkQuadrant.ts#IAutoMovieHumanTrunkQuadrant.SectorShift

## @evidence contracts/development/common.md#meaningful-documentation

The jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian.

## @evidence contracts/development/design.md#principled-representation

The jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian. Alternatives are ((z: number) => [number, number, number]); null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkQuadrant.SectorShift is the canonical exchange used by AutoMovieHumanTrunkQuadrant.sector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkQuadrant.sector for the jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian.

# src/human/generation/IAutoMovieHumanTrunkQuadrant.ts#IAutoMovieHumanTrunkQuadrant.SectorResult

## @evidence contracts/development/common.md#meaningful-documentation

The jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian.

## @evidence contracts/development/design.md#principled-representation

The jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian. Ordered tuple slots are 0, 1, 2; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkQuadrant.SectorResult is the canonical exchange used by AutoMovieHumanTrunkQuadrant.sector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkQuadrant.sector for the jet of a sector at a phase: the quintic Hermite between its two guides' jets over the phases `[t0, t1]`, each end leaving at its guide's speed, plus a displacement along x given as a function of z, per radian.

# src/human/generation/IAutoMovieHumanTrunkQuadrant.ts#IAutoMovieHumanTrunkQuadrant.BetweenKnots

## @evidence contracts/development/common.md#meaningful-documentation

The sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts.

## @evidence contracts/development/design.md#principled-representation

The sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkQuadrant.BetweenKnots is the canonical exchange used by AutoMovieHumanTrunkQuadrant.between.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkQuadrant.between for the sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts.

# src/human/generation/IAutoMovieHumanTrunkQuadrant.ts#IAutoMovieHumanTrunkQuadrant.BetweenSpeeds

## @evidence contracts/development/common.md#meaningful-documentation

The sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts.

## @evidence contracts/development/design.md#principled-representation

The sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkQuadrant.BetweenSpeeds is the canonical exchange used by AutoMovieHumanTrunkQuadrant.between.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkQuadrant.between for the sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts.

# src/human/generation/IAutoMovieHumanTrunkQuadrant.ts#IAutoMovieHumanTrunkQuadrant.BetweenResult

## @evidence contracts/development/common.md#meaningful-documentation

The sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts.

## @evidence contracts/development/design.md#principled-representation

The sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts. The callable takes t and returns [number[], number[], number[]].

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkQuadrant.BetweenResult is the canonical exchange used by AutoMovieHumanTrunkQuadrant.between.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkQuadrant.between for the sector of the canonical left side between two guides as a function of phase, the displacement carried along when the sector lies where it acts.
