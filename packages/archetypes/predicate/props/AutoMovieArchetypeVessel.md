# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.create

## @evidence contracts/development/common.md#meaningful-documentation

States the saved selectors, model-owning kinds, admission and actual named surfaces and grips.

## @evidence contracts/development/implementation.md#principled-implementation

Checks the saved kind and compatible catalogue choice, then delegates to the named construction. Only bowl and ashtray consume the saved model field.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses one checked route and one named producer, leaving the geometry builder and draw to that owner.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the kinds using explicit measurements and those using whole model rows.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.COLORS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the per-kind body palette and its colour encoding.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.GRIP

## @evidence contracts/development/common.md#meaningful-documentation

Gives the actual diameter of the steel vessel handle geometry in metres.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.HANDLE

## @evidence contracts/development/common.md#meaningful-documentation

Gives the exposed saucepan handle's length relative to the body.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

States the optional identity and the saved default.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Explains how a saved kind selects both shape and measurements.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the catalogue-owning shapes and the legacy ignored field behavior on the others.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.IProducers.ashtray

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the glass ashtray factory.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.IProducers.bowl

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the named ceramic bowl catalogue route.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.IProducers.saucepan

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the shared cooking-pot factory with its required saucepan selector.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.IProducers.stockpot

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the same factory with its required stockpot selector.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.IProducers.vase

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the glass vase with its mid-body grip.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Lists the saved kind values and stable order.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.MODELS

## @evidence contracts/development/common.md#meaningful-documentation

States complete bowl and ashtray measurements and defaults, including the provisional IKEA mass.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.PRODUCERS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the named factory lookup with stable archived selectors.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Specifies physical units shared by bands and catalogue.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.WALL

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the measured floor height and the assumed wall thickness.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the opening, supported interior and each kind's handling sites.

## @evidence contracts/development/design.md#principled-representation

The floor and rim sit at different heights. Shallow dishes, upright vase and handled pots each have grips suited to their drawn form.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union preserves the saved names and each concrete producer returns only its applicable subset.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines the rim span, height and empty mass in their source units.

## @evidence contracts/development/design.md#principled-representation

The outside span applies across X and Z and the height places the upward rim. The chosen record supplies whole mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps three measured keys for all named vessel geometries.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.Figures

## @evidence contracts/development/common.md#meaningful-documentation

Describes the common correlated geometry and mass values in one model row.

## @evidence contracts/development/design.md#principled-representation

The catalogue couples outside width and height with the weight of the same model.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the same measured keys as applicable bands without a separate format.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the archived selector, identity, band values and the model handoff rule.

## @evidence contracts/development/design.md#principled-representation

The saved record supports all five variants and applies the actual named model and number admissions for its chosen selector.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shares a single saved parameter shape while the named producers expose narrower options.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.IProducers

## @evidence contracts/development/common.md#meaningful-documentation

Explains that the lookup refers to current named signatures.

## @evidence contracts/development/design.md#principled-representation

The two pot keys share a factory whose required kind selects the version. Ceramic and glass forms keep their own factories.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses the actual typed creation signatures without inventing an alternate saved constructor.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the five specific historical shape selectors.

## @evidence contracts/development/design.md#principled-representation

Each kind identifies real geometry, material and measurement source.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The five literals key both the name lookup and the appropriate band or model table.

# src/props/AutoMovieArchetypeVessel.ts#AutoMovieArchetypeVessel.Model

## @evidence contracts/development/common.md#meaningful-documentation

Names the groups that own the five complete model records.

## @evidence contracts/development/design.md#principled-representation

The named entries separate measured ceramic bowl and glass ashtray dimensions and quantities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union represents exactly the labels present in the two selected catalogue tables.
