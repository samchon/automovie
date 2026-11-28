# src/architecture/AutoMovieArchetypeGate.ts#AutoMovieArchetypeGate.create

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the two cabinet arrangements, their nominal lane sites and default width selections.

## @evidence contracts/development/implementation.md#principled-implementation

The width row supplies a nominal aperture across the drawn barrier, and the right cabinet fixes the upward top surface independently of the barrier kind.

## @evidence contracts/development/implementation.md#efficient-algorithms

Selects one kind and one width, then positions a fixed cabinet and barrier layout from the active dimensions.

# src/architecture/AutoMovieArchetypeGate.ts#AutoMovieArchetypeGate.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Names the two measurement tables and the separate catalogue ownership of lane width.

# src/architecture/AutoMovieArchetypeGate.ts#AutoMovieArchetypeGate.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

States the scene identity default.

# src/architecture/AutoMovieArchetypeGate.ts#AutoMovieArchetypeGate.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Explains how each kind selects a separately constructed layout and measurement record.

# src/architecture/AutoMovieArchetypeGate.ts#AutoMovieArchetypeGate.IParams.lane

## @evidence contracts/development/common.md#meaningful-documentation

Explains that the selected label belongs to the chosen gate kind's width table.

# src/architecture/AutoMovieArchetypeGate.ts#AutoMovieArchetypeGate.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

States the pair of exact admitted selectors in stable order.

# src/architecture/AutoMovieArchetypeGate.ts#AutoMovieArchetypeGate.PASSAGES

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the kind-indexed catalogue labels from their numeric metre widths.

# src/architecture/AutoMovieArchetypeGate.ts#AutoMovieArchetypeGate.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

States units used by all fixed and drawn gate measurements.

# src/architecture/AutoMovieArchetypeGate.ts#AutoMovieArchetypeGate.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Locates the configured lane aperture and negative-X cabinet surface.

## @evidence contracts/development/design.md#principled-representation

The aperture represents lane alignment at floor level. The cabinet top spans its drawn depth and width at full height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two names expose the built placement surface and nominal passage reference.

# src/architecture/AutoMovieArchetypeGate.ts#AutoMovieArchetypeGate.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Lists cabinet, lane and barrier measures in metres with mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

The selected lane sets span, while cabinet and barrier values represent their distinct physical contributions. Only turnstiles use arm settings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Common keys cover the actual geometry and kind-specific optional subsets.

# src/architecture/AutoMovieArchetypeGate.ts#AutoMovieArchetypeGate.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the kind, matching lane, scene identity and finite applicable dimensions.

## @evidence contracts/development/design.md#principled-representation

Choice of layout controls which rows admit settings. Catalogue width stays paired with its label.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared input contains only the options read by the factory.

# src/architecture/AutoMovieArchetypeGate.ts#AutoMovieArchetypeGate.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the single-cabinet arm layout and the opposed-cabinet wing layout.

## @evidence contracts/development/design.md#principled-representation

One kind uses a single cabinet and arm, while the other uses two opposed cabinets and wings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two choices match exactly the two generated bodies and their separate lane tables.

# src/architecture/AutoMovieArchetypeGate.ts#AutoMovieArchetypeGate.Passage

## @evidence contracts/development/common.md#meaningful-documentation

Names kind-specific width labels and their nominal millimetre unit.

## @evidence contracts/development/design.md#principled-representation

A width label selects the actual stored opening span for its matching kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five literals cover exactly the admitted lane rows.
