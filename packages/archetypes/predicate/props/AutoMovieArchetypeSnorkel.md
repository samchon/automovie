# src/props/AutoMovieArchetypeSnorkel.ts#AutoMovieArchetypeSnorkel.create

## @evidence contracts/development/common.md#meaningful-documentation

The comment locates the mouthpiece and top, identifies the required staged air clearance, and gives seedless dimensions and refusal behavior.

## @evidence contracts/development/implementation.md#principled-implementation

The mouthpiece socket is the local origin and looks along the same axis used to mount the prop. The top socket is fixed at the barrel's actual upper endpoint, so a consumer can compare the posed point with the water plane.

## @evidence contracts/development/implementation.md#efficient-algorithms

One band draw supplies the barrel rise and mass. The constructor builds two rods and two sites, with runtime reading of the mounted frame left to the scene.

# src/props/AutoMovieArchetypeSnorkel.ts#AutoMovieArchetypeSnorkel.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

The record marks the barrel height and mass ranges as staging estimates.

# src/props/AutoMovieArchetypeSnorkel.ts#AutoMovieArchetypeSnorkel.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The optional ID names the model and defaults to `snorkel`.

# src/props/AutoMovieArchetypeSnorkel.ts#AutoMovieArchetypeSnorkel.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

The tube rise is measured in metres and the mass in kilograms.

# src/props/AutoMovieArchetypeSnorkel.ts#AutoMovieArchetypeSnorkel.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The identifiers name the mouthpiece mounting socket and tube opening.

## @evidence contracts/development/design.md#principled-representation

The two point frames distinguish the mounting point from the model point whose water clearance can be read after posing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The snorkel owns both positions. The scene owns attachment and the horizontal water reference.

# src/props/AutoMovieArchetypeSnorkel.ts#AutoMovieArchetypeSnorkel.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The keys give the tube's height in metres and the prop mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

The tube's rise sets both its rod endpoint and the `top` socket. The mass is independent and goes to the builder.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The producer exposes the two drawn values used by the model and owns the fixed barrel offset.

# src/props/AutoMovieArchetypeSnorkel.ts#AutoMovieArchetypeSnorkel.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The inputs identify the subject and optional in-band values.

## @evidence contracts/development/design.md#principled-representation

Each authored dimension goes through the shared finite band admission before either rod is built.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Callers can reproduce or override the model's two band values and use the contact frame to stage it.
