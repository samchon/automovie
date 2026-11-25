# src/striking/punchCompose.ts#punchCompose

## @evidence contracts/development/common.md#meaningful-documentation

States what it builds from the plan's prepared values and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The punch's posture at a time and a clock: the footwork's base or a bare base, the guard raised over it, and the striking arm's wrist at `end` sunk by the drop's sag, its elbow led by the wrist's share of its way from the guard so it stays behind the fist (`StrikingStroke.delivery` peaks late), its rotation by the clock, and its reference configuration blended from the launch toward the anchored one unless bare.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `punchGeometry.build`: its `compose`, built from what that plan prepared, apart from the plan's other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `punchGeometry.build`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called once per plan where `punchGeometry.build` built it before; its cost is the moved code's, and any reader it returns evaluates as it did.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the plan's prepared values instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what the returned value holds, for as long as the plan holds it.

# src/striking/punchCompose.ts#punchCompose.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the plan value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `punchGeometry.build` prepared before its `compose`, each typed as that plan declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `punchCompose.of` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.

# src/striking/punchCompose.ts#punchCompose.IBuildComposeBare

## @evidence contracts/development/common.md#meaningful-documentation

Names a shape `punchGeometry.build` and its parts share.

## @evidence contracts/development/design.md#principled-representation

The alias `IBuildComposeBare` names the plan's own shape; its units and frames are those of the members it is built from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `punchGeometry.build` and the parts cut from it.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

An alias of existing types; it adds no shape of its own.

# src/striking/punchCompose.ts#punchCompose.BuildArm

## @evidence contracts/development/common.md#meaningful-documentation

Names a shape `punchGeometry.build` and its parts share.

## @evidence contracts/development/design.md#principled-representation

The alias `BuildArm` names the plan's own shape; its units and frames are those of the members it is built from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `punchGeometry.build` and the parts cut from it.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

An alias of existing types; it adds no shape of its own.
