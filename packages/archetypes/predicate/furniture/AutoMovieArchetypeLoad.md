# src/furniture/AutoMovieArchetypeLoad.ts#AutoMovieArchetypeLoad.create

## @evidence contracts/development/common.md#meaningful-documentation

States actual proxy geometry, grip locations, contents units and refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The selected band record sets a floor-standing box and base mass. Finite optional contents are bounded by kind and added to the drawn mass. Both grips and the stack outline follow the built box dimensions.

## @evidence contracts/development/implementation.md#efficient-algorithms

One dimensional draw and one contents check feed a single box, two frames and a four-vertex support outline.

# src/furniture/AutoMovieArchetypeLoad.ts#AutoMovieArchetypeLoad.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the two choices controlling grip height and the contents guard.

## @evidence contracts/development/design.md#principled-representation

Crate and sack select distinct geometric and weight bands and each has its own contents maximum.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One selector controls the branch-specific model and its applicable limits.

# src/furniture/AutoMovieArchetypeLoad.ts#AutoMovieArchetypeLoad.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Lists the crate and sack options.

# src/furniture/AutoMovieArchetypeLoad.ts#AutoMovieArchetypeLoad.LIMIT

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the maximum modeled aggregate mass in kilograms.

# src/furniture/AutoMovieArchetypeLoad.ts#AutoMovieArchetypeLoad.CONTENTS

## @evidence contracts/development/common.md#meaningful-documentation

States its relation to the heaviest admitted crate and total modeled mass.

# src/furniture/AutoMovieArchetypeLoad.ts#AutoMovieArchetypeLoad.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Locates both end holds and the upper rectangular contact.

## @evidence contracts/development/design.md#principled-representation

The handles use opposite half-length positions and the kind's grip height. The stack top uses all four corners of the same body box.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The type exposes the three supported hand and stacking sites.

# src/furniture/AutoMovieArchetypeLoad.ts#AutoMovieArchetypeLoad.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Names the model axes and base or aggregate mass distinction.

## @evidence contracts/development/design.md#principled-representation

Physical length, height and depth control the model in metres. Drawn mass is the crate base or whole sack and contents only affect the finalized body mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Records preserve the base measurement independently of the payload setting.

# src/furniture/AutoMovieArchetypeLoad.ts#AutoMovieArchetypeLoad.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies metres for geometry and kilograms for mass.

# src/furniture/AutoMovieArchetypeLoad.ts#AutoMovieArchetypeLoad.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the variant, optional ID, fixed dimensions and extra mass.

## @evidence contracts/development/design.md#principled-representation

The selected kind admits dimension values through its bands and explicitly bounds finite extra contents separately.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The surface names one payload scalar and keeps it separate from sourced base mass.

# src/furniture/AutoMovieArchetypeLoad.ts#AutoMovieArchetypeLoad.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the selector controlling bands and extra-mass allowance.

# src/furniture/AutoMovieArchetypeLoad.ts#AutoMovieArchetypeLoad.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the scene ID and `load` default.

# src/furniture/AutoMovieArchetypeLoad.ts#AutoMovieArchetypeLoad.IParams.load

## @evidence contracts/development/common.md#meaningful-documentation

States finite contents in kilograms, the crate limit and the sack's zero.

# src/furniture/AutoMovieArchetypeLoad.ts#AutoMovieArchetypeLoad.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes each shape and base mass band from additional modeled contents.
