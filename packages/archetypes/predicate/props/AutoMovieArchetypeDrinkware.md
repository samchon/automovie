# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Chooses the body shape, contacts, catalogue, capacity and defaults. The factory checks it against the seven saved alternatives.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

The beer-bottle choice supplies three figures together. The factory picks a default or seeded record when omitted. Other kinds refuse a named beer-bottle model.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The scene model keeps its supplied ID. The builder uses the drinkware family ID when omitted.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.IParams.fill

## @evidence contracts/development/common.md#meaningful-documentation

The default empty vessel adds zero contents. A finite numeric fraction from zero to one adds the proportional liquid mass at one kilogram per litre.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.create

## @evidence contracts/development/common.md#meaningful-documentation

The public documentation names the local frame, conditional contacts, default empty fill, empty materials and supplied seed route. It gives hook clearance and diameter their separate meanings and lists producer refusal conditions.

## @evidence contracts/development/implementation.md#principled-implementation

The factory builds each vessel from the admitted kind's catalogue and bands. The body and conditional grips use the emitted cylinder axes. The hook uses the centre of the emitted bar after lower-stub placement. The rim is the body or bottle neck's outer radius at vessel height. Hook, body, lip and cylinder observations are pinned by the drinkware contact test. The fracture-set test measures transfer and fragment behavior from the declared model sets.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw session resolves bands and the selected record. Each kind emits a bounded number of cylinders and named affordances. The assembled model owns its shapes and optional fracture sets. Draw and builder state exist only for this invocation.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.BREAKING

## @evidence contracts/development/common.md#meaningful-documentation

The table names the measured energy units and experimental bottle and fill conditions. Its empty and full keys are the only values used for the producer's fracture metadata.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies each of the seven drinking vessel constructions.

## @evidence contracts/development/design.md#principled-representation

The factory admits one kind against the same saved string list used by its material, geometry and catalogue routes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A single kind identifies the catalogue and its generated affordances. The model ID and fill are independent inputs.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

The list exposes the saved input values the factory accepts, in catalogue order.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The declaration locates the body and lip contacts and names which kinds add a handle, stem, neck or opening.

## @evidence contracts/development/design.md#principled-representation

Every kind builds the body and lip. Conditional contacts are emitted only where the selected geometry includes the corresponding part.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The factory and its typed affordance lookup use these names. Each contact's frame and physical meaning reside in the emitted affordance record.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The fields document lengths in metres and empty mass in kilograms. The hook bar diameter, clear depth and clear height have independent meanings.

## @evidence contracts/development/design.md#principled-representation

A kind's band and catalogue jointly establish which dimension IDs may be supplied. The draw session rejects a fixed value outside the active bands or conflicting with the selected model.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same dimension keys label the input overrides, band bounds and output measurements. Part-specific geometry reads only its chosen kind's dimensions.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Length measurements use metres and empty mass uses kilograms. The draw session uses this table for both bands and model figures.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The fields name the required vessel kind, the optional beer-bottle record, the default scene ID and fill. Fill uses a capacity fraction and adds mass at one kilogram per litre.

## @evidence contracts/development/design.md#principled-representation

A record carries a required kind with optional overrides. The factory admits the kind, checks fill from zero to one and uses the draw session to validate applicable options.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Scene identity, fill and catalogue selection vary independently. The fields reuse the dimension and model keys used by the producer and its output provenance.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.LOOP

## @evidence contracts/development/common.md#meaningful-documentation

The three source ranges distinguish a bar diameter from the clear loop depth and height. The cup and mug share these bands.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.Figures

## @evidence contracts/development/common.md#meaningful-documentation

Records store only named measured dimensions. The dimension documentation supplies their units.

## @evidence contracts/development/design.md#principled-representation

A beer bottle's record supplies height, body diameter and empty mass. Its neck diameter is independently admitted from a band.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The public record reuses the producer's dimension keys and is read by catalogue selection and provenance.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.Model

## @evidence contracts/development/common.md#meaningful-documentation

Each ID names one published longneck reference used by the beer bottle catalogue.

## @evidence contracts/development/design.md#principled-representation

The saved model union identifies the four accepted beer-bottle records. Other kinds lack that catalogue and the draw session refuses a model choice there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Model IDs select the height, diameter and mass together. The record table owns their measured values.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.MODELS

## @evidence contracts/development/common.md#meaningful-documentation

The public catalogue names its source records, values and default order. Each beer-bottle record supplies metres and kilograms.

# src/props/AutoMovieArchetypeDrinkware.ts#AutoMovieArchetypeDrinkware.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

The table gives a sourced range for each free dimension and kind. The draw session refuses dimension overrides that fall outside the active band's range.
