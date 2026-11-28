# src/furniture/AutoMovieArchetypeDrawerUnit.ts#AutoMovieArchetypeDrawerUnit.create

## @evidence contracts/development/common.md#meaningful-documentation

Describes the three- and four-drawer forms, numbered motion, carried pulls and the default chest slide.

## @evidence contracts/development/implementation.md#principled-implementation

The drawer owner validates the variant, chooses the catalogue entry if applicable and builds part groups that the drawer mechanism can move together.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw and one linear pass over the variant's fixed drawer count builds its collider groups and contact frames.

# src/furniture/AutoMovieArchetypeDrawerUnit.ts#AutoMovieArchetypeDrawerUnit.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Gives box, travel and mass units for both drawer types.

## @evidence contracts/development/design.md#principled-representation

The result reports the body and drawer geometry. A catalogue entry supplies chest travel, and the filing-cabinet band supplies its travel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union includes only dimensions used by drawer units.

# src/furniture/AutoMovieArchetypeDrawerUnit.ts#AutoMovieArchetypeDrawerUnit.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes carried chest pulls from shared sliding drawers and static surfaces.

## @evidence contracts/development/design.md#principled-representation

Drawers use bottom-up names and carry their associated geometry along model +Z. The chest includes the grip sites carried by that movement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the existing `drawer`, `pull`, `push` and `top` IDs of saved parts.

# src/furniture/AutoMovieArchetypeDrawerUnit.ts#AutoMovieArchetypeDrawerUnit.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Explains the chest and filing-cabinet setting alternatives.

## @evidence contracts/development/design.md#principled-representation

Discrimination on `kind` ties the chest to a catalogue slide and the filing cabinet to its own travel band.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Part geometry and movement are selected by one variant key.

# src/furniture/AutoMovieArchetypeDrawerUnit.ts#AutoMovieArchetypeDrawerUnit.Slide

## @evidence contracts/development/common.md#meaningful-documentation

States the three recorded Accuride slide travel lengths.

## @evidence contracts/development/design.md#principled-representation

The discrete choices correspond to whole recorded 3832E travel figures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The slide selection controls travel through one field.

# src/furniture/AutoMovieArchetypeDrawerUnit.ts#AutoMovieArchetypeDrawerUnit.IBaseParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the shared optional scene and body dimensions.

## @evidence contracts/development/design.md#principled-representation

Both variants admit the same body field names in metres and kilograms through their own bands.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A shared field selection keeps the drawer route compatible with saved units.

# src/furniture/AutoMovieArchetypeDrawerUnit.ts#AutoMovieArchetypeDrawerUnit.IChestParams

## @evidence contracts/development/common.md#meaningful-documentation

Describes the three-drawer chest and its catalogue-controlled travel.

## @evidence contracts/development/design.md#principled-representation

The discriminator and slide name select the chest's movable geometry and the whole recorded travel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shape omits a second author-controlled travel for the same chest slide.

# src/furniture/AutoMovieArchetypeDrawerUnit.ts#AutoMovieArchetypeDrawerUnit.IChestParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the physical chest branch.

# src/furniture/AutoMovieArchetypeDrawerUnit.ts#AutoMovieArchetypeDrawerUnit.IChestParams.model

## @evidence contracts/development/common.md#meaningful-documentation

States the slide's role and the seedless 12 inch default.

# src/furniture/AutoMovieArchetypeDrawerUnit.ts#AutoMovieArchetypeDrawerUnit.IFilingCabinetParams

## @evidence contracts/development/common.md#meaningful-documentation

States the four-drawer construction and its fixed travel band.

## @evidence contracts/development/design.md#principled-representation

The filing-cabinet band's endpoints record its fixed filing length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

It shares the body parameters and adds the filing-specific travel field.

# src/furniture/AutoMovieArchetypeDrawerUnit.ts#AutoMovieArchetypeDrawerUnit.IFilingCabinetParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the physical filing-cabinet branch.

# src/furniture/AutoMovieArchetypeDrawerUnit.ts#AutoMovieArchetypeDrawerUnit.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Names both selectors admitted by the public drawer route.
