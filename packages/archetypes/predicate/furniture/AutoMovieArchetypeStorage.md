# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.create

## @evidence contracts/development/common.md#meaningful-documentation

Explains the saved route, shared draw identity, local contacts and seedless defaults.

## @evidence contracts/development/implementation.md#principled-implementation

Validates the saved kind before choosing a named producer. The chosen factory receives both original arguments, keeping its existing dimension and contact admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

One lookup delegates to the owning producer. The facade has no geometric construction or seed draws of its own.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.IProducers

## @evidence contracts/development/common.md#meaningful-documentation

Names the mapping between saved selectors and typed factory functions.

## @evidence contracts/development/design.md#principled-representation

Each property takes the parameter and return types from the named factory, preserving its variant-specific contact surface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mapping exposes existing authoring functions and gives callers a migration path from saved selectors.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.IProducers.wardrobe

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the named wardrobe factory.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the hinged factory's typed signature, which retains the wardrobe's hinge and local contact contract.

## @evidence contracts/development/implementation.md#efficient-algorithms

The factory reference introduces no extra call or state.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.IProducers.chest

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the named chest factory.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the drawer factory's signature and its chest slide choices.

## @evidence contracts/development/implementation.md#efficient-algorithms

The factory reference introduces no extra call or state.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.IProducers.filingCabinet

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the named filing-cabinet factory.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the drawer factory's signature and its filing-cabinet geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

The factory reference introduces no extra call or state.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.IProducers.locker

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the named locker factory.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the hinged factory's signature and its locker geometry and size options.

## @evidence contracts/development/implementation.md#efficient-algorithms

The factory reference introduces no extra call or state.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.IProducers.bookcase

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the named bookcase factory.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the open bookcase factory's parameter and contact types.

## @evidence contracts/development/implementation.md#efficient-algorithms

The factory reference introduces no extra call or state.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.PRODUCERS

## @evidence contracts/development/common.md#meaningful-documentation

Explains how callers obtain the named factory and whose settings it uses.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.Kind

## @evidence contracts/development/common.md#meaningful-documentation

States that the selector chooses actual hinged, sliding or open geometry.

## @evidence contracts/development/design.md#principled-representation

The closed saved kind set maps to five concrete build choices and validates each selection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One kind chooses the physical mechanism, dimension bands and catalogue row.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Lists the five saved selectors used to admit `create` inputs.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Lists shared surfaces and variant-specific movable doors, grips, drawers and shelves.

## @evidence contracts/development/design.md#principled-representation

Named contacts describe the mechanism or contact geometry actually emitted by each kind. Numbered sites follow bottom-up indices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union supports lookup across saved variants. Named producer return types expose each smaller compatible vocabulary.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Lists axes, physical units and the locker body's relationship to its legs.

## @evidence contracts/development/design.md#principled-representation

Length and mass retain numeric units independent of their source band or catalogue row. Door travel in degrees and drawer travel in metres have different names.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The names match draw provenance, authored dimensions and consumer geometry without duplicate parameter vocabularies.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the shared source of dimension-unit labels for the storage family.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.Model

## @evidence contracts/development/common.md#meaningful-documentation

Names the supported wardrobe hinge, chest slide and locker body catalogues.

## @evidence contracts/development/design.md#principled-representation

Each closed name selects a correlated group of physical figures from the selected kind's model table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Catalogue choices own their figures. Kinds without a catalogue use the dimensions in their bands.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States how fixed band dimensions and catalogue choices enter saved recipes.

## @evidence contracts/development/design.md#principled-representation

The saved shape holds a kind and optional physical scalars. The selected producer checks applicability and preserves catalogue ownership.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The named producers narrow the supported setting set while the saved entry keeps one replay shape.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the selector that chooses the physical variant.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

Gives the applicable catalogue and its seedless first entry for each kind.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Names the scene object identifier and its `storage` default.

# src/furniture/AutoMovieArchetypeStorage.ts#AutoMovieArchetypeStorage.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes directly drawn dimensions from catalogue-owned figures.
