# src/animals/QuadrupedProportions.ts#QuadrupedProportions.LimbValues

## @evidence contracts/development/common.md#meaningful-documentation

States the order and where the unit is stated.

## @evidence contracts/development/design.md#principled-representation

A readonly four-tuple, so the type rules out a missing or extra bone; finiteness and range stay with the body's admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared by ILengths, IStance and IMassShares for each limb.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One tuple for the one limb shape every quadruped here has.

# src/animals/QuadrupedProportions.ts#QuadrupedProportions.ILengths

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the reference height and the limb order.

## @evidence contracts/development/design.md#principled-representation

Dimensionless fractions of withers height, so one record scales to any body size.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieArchetypeQuadrupedBody.IBody and stated by createHorse.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required; fore and hind limbs keep separate values.

# src/animals/QuadrupedProportions.ts#QuadrupedProportions.IStance

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the reference direction, its sign and the limb order.

## @evidence contracts/development/design.md#principled-representation

Degrees in the sagittal plane, the form the anatomical studies report.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieArchetypeQuadrupedBody.IBody and stated by createHorse.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required; fore and hind limbs keep separate values.

# src/animals/QuadrupedProportions.ts#QuadrupedProportions.IMassShares

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, its reference and the parts covered.

## @evidence contracts/development/design.md#principled-representation

Percent of body mass, as the studies print them, so a stated value is the source's own.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Stated by createHorse and extended by IBodyMass for the body.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required; the type does not enforce that the shares sum to the whole body.

# src/animals/QuadrupedProportions.ts#QuadrupedProportions.IBodyMass

## @evidence contracts/development/common.md#meaningful-documentation

States the added share and its zero case.

## @evidence contracts/development/design.md#principled-representation

The study's shares plus one percent share for the withers part.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieArchetypeQuadrupedBody.IBody.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The withers share is required and 0 when absent, instead of an optional member.

# src/animals/QuadrupedProportions.ts#QuadrupedProportions.INeck

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning and unit.

## @evidence contracts/development/design.md#principled-representation

Two fractions of the withers height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `AutoMovieArchetypeQuadrupedBody.IBody.neck`, the rig and the neck bar.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedProportions.ts#QuadrupedProportions.IPoll

## @evidence contracts/development/common.md#meaningful-documentation

States each member's reference point and unit.

## @evidence contracts/development/design.md#principled-representation

Two fractions of the withers height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `IHead.poll`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedProportions.ts#QuadrupedProportions.INose

## @evidence contracts/development/common.md#meaningful-documentation

States each member's reference point and unit.

## @evidence contracts/development/design.md#principled-representation

Two fractions of the withers height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `IHead.nose`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedProportions.ts#QuadrupedProportions.IHead

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning and unit, and which parts are optional.

## @evidence contracts/development/design.md#principled-representation

Fractions of the withers height for the capsule and each optional part's own profile.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `AutoMovieArchetypeQuadrupedBody.IBody.head` and `AutoMovieArchetypeQuadrupedHead`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent ear, jaw, lip or nostril profile lays no part instead of a default one.

# src/animals/QuadrupedProportions.ts#QuadrupedProportions.ITail

## @evidence contracts/development/common.md#meaningful-documentation

States each member's reference and unit.

## @evidence contracts/development/design.md#principled-representation

Three fractions of the withers height and one of the barrel's radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `AutoMovieArchetypeQuadrupedBody.IBody.tail` and the tail bar.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedProportions.ts#QuadrupedProportions.IColors

## @evidence contracts/development/common.md#meaningful-documentation

States what each colour paints.

## @evidence contracts/development/design.md#principled-representation

Two colour strings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `AutoMovieArchetypeQuadrupedBody.IBody.colors` and the body's parts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No material or friction is inferred from a colour.
