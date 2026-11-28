# src/props/AutoMovieArchetypeLaptop.ts#AutoMovieArchetypeLaptop.create

## @evidence contracts/development/common.md#meaningful-documentation

The producer identifies the default open pose, rear hinge travel in degrees, keyboard direction, supplied model choices and candidate seed.

## @evidence contracts/development/implementation.md#principled-implementation

The measured input deck fixes the hinge centre on its rear edge. The lid is drawn at the authored open angle and turns about the deck's width axis. Its screen and grip share that rigid articulation. At the full closing travel the screen meets the deck plane and the fixed keyboard stays in its original frame, as the laptop fixture checks.

## @evidence contracts/development/implementation.md#efficient-algorithms

The construction builds one deck and one lid, then records their contact frames once. The produced model holds a fixed number of added parts and contacts. It retains no task or host resource.

# src/props/AutoMovieArchetypeLaptop.ts#AutoMovieArchetypeLaptop.Model

## @evidence contracts/development/common.md#meaningful-documentation

The type identifies the producer's two selectable manufacturer models.

## @evidence contracts/development/design.md#principled-representation

Each model key selects one measured width, depth, deck height and mass row. The producer admits only the two laptop rows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The selector reuses the producer's existing dimension rows and exposes no partial hardware record.

# src/props/AutoMovieArchetypeLaptop.ts#AutoMovieArchetypeLaptop.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The type describes the dimension keys and distinguishes metre-based lengths from kilograms.

## @evidence contracts/development/design.md#principled-representation

The keyboard hardware row fixes the three actual spatial dimensions and the model's mass. The deck uses them as metres and kilograms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The dimension keys use the shared archetype draw and provenance surface. The articulation owns hinge travel.

# src/props/AutoMovieArchetypeLaptop.ts#AutoMovieArchetypeLaptop.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The declaration lists the deck, hinge and display contact identifiers built by the producer.

## @evidence contracts/development/design.md#principled-representation

Keyboard and home-row contacts remain on the base. The hinge controls the display, whose two carried sites keep their own roles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The identifiers address the actual model affordances and reuse the display's named type.

# src/props/AutoMovieArchetypeLaptop.ts#AutoMovieArchetypeLaptop.Display

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names the display surface and lid grasp.

## @evidence contracts/development/design.md#principled-representation

The screen is a sized reading surface and the lid grasp is a precision handle. Both follow the display's rigid hinge.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This type groups the display's two carried sites. The enclosing affordance union includes the hinge actuator.

# src/props/AutoMovieArchetypeLaptop.ts#AutoMovieArchetypeLaptop.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The record identifies the optional scene id and model and states how the producer selects a model when omitted.

## @evidence contracts/development/design.md#principled-representation

The optional id labels the staged asset. The optional model selects a manufacturer row. The draw selects the model when omitted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The authored record contains only the reusable identity and hardware selector. The producer owns derived geometry and the articulation owns its travel.

# src/props/AutoMovieArchetypeLaptop.ts#AutoMovieArchetypeLaptop.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The optional id identifies the generated model in the scene.

# src/props/AutoMovieArchetypeLaptop.ts#AutoMovieArchetypeLaptop.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

The optional selector names an admitted manufacturer model. The seed selects a row when the author omits it.
