# src/vehicles/AutoMovieArchetypeKayak.ts#AutoMovieArchetypeKayak.create

## @evidence contracts/development/common.md#meaningful-documentation

The contract gives the local waterline, seat and brace side identifiers, fixed catalogue dimensions, staged construction and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A longitudinal section family supplies the lower hull and side decks. The deck strips leave an open cockpit, so the forward-facing seat and two separate inclined faces are inside it. The brace sites use the installed face normals.

## @evidence contracts/development/implementation.md#efficient-algorithms

A single fixed-size draw supplies the envelope. The hull uses a bounded set of section stations and creates one seat and two brace faces.

# src/vehicles/AutoMovieArchetypeKayak.ts#AutoMovieArchetypeKayak.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

The record fixes the Pungo 120 envelope, cockpit opening and bare hull mass.

# src/vehicles/AutoMovieArchetypeKayak.ts#AutoMovieArchetypeKayak.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The optional ID names the scene model and defaults to `kayak`.

# src/vehicles/AutoMovieArchetypeKayak.ts#AutoMovieArchetypeKayak.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Hull and cockpit figures are in metres and mass is in kilograms.

# src/vehicles/AutoMovieArchetypeKayak.ts#AutoMovieArchetypeKayak.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The declaration distinguishes the forward seat and the two cockpit footbrace faces.

## @evidence contracts/development/design.md#principled-representation

The seat frame and brace surfaces describe the named support bodies that the kayaking stroke reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The hull supplies all support sites; the paddle supplies grip and blade sites through its separate model.

# src/vehicles/AutoMovieArchetypeKayak.ts#AutoMovieArchetypeKayak.Brace

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the foot names and their local X signs.

## @evidence contracts/development/design.md#principled-representation

The brace builder uses the left and right signs with a shared geometric construction, giving each authored foot its own frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two explicit keys expose the named support the paddler needs.

# src/vehicles/AutoMovieArchetypeKayak.ts#AutoMovieArchetypeKayak.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The keys identify hull and cockpit measurements in metres and bare hull mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

Every key has a fixed manufacturer-envelope band. Dimensions build the hull section coordinates and record the intended cockpit and mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The catalogue owns the fixed measurements. Construction estimates stay on the recipe side of the API.

# src/vehicles/AutoMovieArchetypeKayak.ts#AutoMovieArchetypeKayak.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The inputs name an optional scene ID and permit explicit copies of the reference figures.

## @evidence contracts/development/design.md#principled-representation

The generic optional number fields are admitted only when they equal their fixed catalogue bands.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Callers can preserve an explicit saved measurement without gaining a different hull shape through this constructor.
