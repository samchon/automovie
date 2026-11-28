# src/props/internal/HandheldDevice.ts#HandheldDevice.caseBody

## @evidence contracts/development/common.md#meaningful-documentation

Defines case dimensions, model axes and floor rest.

## @evidence contracts/development/implementation.md#principled-implementation

One box at half its height fills the authored extents from Y zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds a single box to the already prepared builder.

# src/props/internal/HandheldDevice.ts#HandheldDevice.draw

## @evidence contracts/development/common.md#meaningful-documentation

States the variant, applicable settings, defaults and admitted builder pairing.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the selected kind's bands and model with one draw session. Every supported row fills the four required fields through a single source set. Its builder uses the same provenance record.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits the applicable bands and one catalogue row, then initializes one model builder. It leaves part creation to the named producer.

# src/props/internal/HandheldDevice.ts#HandheldDevice.front

## @evidence contracts/development/common.md#meaningful-documentation

States the supplied Y and thickness and the forward frame.

## @evidence contracts/development/implementation.md#principled-implementation

Offsetting by half thickness places the frame at the forward boundary with normal +Z and tangent +X.

## @evidence contracts/development/implementation.md#efficient-algorithms

Makes one orthogonal frame directly from constant axes and the stated position.

# src/props/internal/HandheldDevice.ts#HandheldDevice.fullFace

## @evidence contracts/development/common.md#meaningful-documentation

States the two profiles, correct face pairing, assumed dimensions and emitted contacts.

## @evidence contracts/development/implementation.md#principled-implementation

The named caller selects its front label and catalogue. A rectangle supports a rear power grasp with aperture equal to actual thickness, and the front contact spans width and height on +Z.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuses one draw and one box, and adds two frames. Both contacts use the box's dimensions.

# src/props/internal/HandheldDevice.ts#HandheldDevice.smallGrips

## @evidence contracts/development/common.md#meaningful-documentation

States both rear-grip heights and how thickness becomes aperture.

## @evidence contracts/development/implementation.md#principled-implementation

Uses a vertical rear power grasp at 40 percent height and a transverse rear pinch 0.02 metres above the bottom. Each uses actual case thickness for its aperture.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constructs two independent frames in constant work from the known case.

# src/props/internal/HandheldDevice.ts#HandheldDevice.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies phone and remote as the only adjustable case records.

# src/props/internal/HandheldDevice.ts#HandheldDevice.IDrawResult.builder

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the builder carrying the same draw's source records.

# src/props/internal/HandheldDevice.ts#HandheldDevice.IDrawResult.size

## @evidence contracts/development/common.md#meaningful-documentation

Names the four admitted model dimensions and their units.

# src/props/internal/HandheldDevice.ts#HandheldDevice.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Defines the default `device` scene ID.

# src/props/internal/HandheldDevice.ts#HandheldDevice.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the variant used to select source data.

# src/props/internal/HandheldDevice.ts#HandheldDevice.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

States which kinds consume the field and the incompatibility check used by named phone and remote factories.

# src/props/internal/HandheldDevice.ts#HandheldDevice.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Lists the saved order used for admission and gallery creation.

# src/props/internal/HandheldDevice.ts#HandheldDevice.MODELS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the named catalogue sources and first-row defaults.

# src/props/internal/HandheldDevice.ts#HandheldDevice.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Names the units retained by bands, catalogue figures and final provenance.

# src/props/internal/HandheldDevice.ts#HandheldDevice.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the available hand, camera, button, face and speaker sites.

## @evidence contracts/development/design.md#principled-representation

Actual device layouts select a physical subset of these names. Full-face slab models use their own typed pair while shallow cases use two distinct grips.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared union coordinates saved recipes and common geometry builders.

# src/props/internal/HandheldDevice.ts#HandheldDevice.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines three model axes, the lens exception and mass in its unit.

## @evidence contracts/development/design.md#principled-representation

Every body uses a width, upright height, case thickness and mass. A camera separates its case from the added lens rod.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One common physical shape carries compatible values through draw and construction.

# src/props/internal/HandheldDevice.ts#HandheldDevice.FaceAndGrip

## @evidence contracts/development/common.md#meaningful-documentation

Names the rear grip and the specific front surface name.

## @evidence contracts/development/design.md#principled-representation

The generic preserves which front label accompanies the common grip in the result.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps precise named contacts across one shared implementation.

# src/props/internal/HandheldDevice.ts#HandheldDevice.FaceContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the tablet screen and radio speaker labels.

## @evidence contracts/development/design.md#principled-representation

The selected label owns the full forward plane of the associated slab.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The type supplies the front contact choice reused by the two slab factories.

# src/props/internal/HandheldDevice.ts#HandheldDevice.Figures

## @evidence contracts/development/common.md#meaningful-documentation

States the numeric dimensions and mass of a single catalogue row.

## @evidence contracts/development/design.md#principled-representation

Catalogue figures share the same unit mapping as bands and form an atomic choice by model name.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Producers receive one map for the selected model and overlay any separately allowed band values.

# src/props/internal/HandheldDevice.ts#HandheldDevice.FullFaceKind

## @evidence contracts/development/common.md#meaningful-documentation

Names the two kinds constructed as a slab with a full-face frame.

## @evidence contracts/development/design.md#principled-representation

Each admitted kind uses a complete body dimension and mass row from its own catalogue.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The helper is shared by tablet and radio and accepts their two selectors.

# src/props/internal/HandheldDevice.ts#HandheldDevice.IDrawResult

## @evidence contracts/development/common.md#meaningful-documentation

Defines complete admitted numeric values and the accompanying builder.

## @evidence contracts/development/design.md#principled-representation

Each construction receives four recorded dimension values and the initialized builder that owns their provenance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Splits admission from geometry while providing a builder and the fixed values the caller needs.

# src/props/internal/HandheldDevice.ts#HandheldDevice.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States saved kind, ID and applicable author options.

## @evidence contracts/development/design.md#principled-representation

The saved discriminant selects band or catalogue geometry. The saved entry drops an unused model for phone and remote. Named constructors validate any model they receive against their available choices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared saved record contains optional model and dimension fields accepted or refused by the chosen owner.

# src/props/internal/HandheldDevice.ts#HandheldDevice.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the saved kinds and radio spelling.

## @evidence contracts/development/design.md#principled-representation

Each choice carries its own factory and applicable source data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One selector associates catalogue and bands with the construction.

# src/props/internal/HandheldDevice.ts#HandheldDevice.Model

## @evidence contracts/development/common.md#meaningful-documentation

Names the catalogue choice groups and their associated kinds.

## @evidence contracts/development/design.md#principled-representation

Each label identifies one maker-specific catalogue row and keeps its dimensions coupled.

## @evidence contracts/development/design.md#minimal-and-owned-surface

No additional figure controls are needed to select a row.

# src/props/internal/HandheldDevice.ts#HandheldDevice.SmallGripsContact

## @evidence contracts/development/common.md#meaningful-documentation

Identifies two distinct shallow-case grasp names.

## @evidence contracts/development/design.md#principled-representation

The two names distinguish longitudinal and lateral grasps that share the same thickness aperture.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Defines the returned contact types used by phone and remote.
