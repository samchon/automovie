# src/props/AutoMovieArchetypeShavingRazor.ts#AutoMovieArchetypeShavingRazor.create

## @evidence contracts/development/common.md#meaningful-documentation

States the measured default, face geometry, named models and handle orientation.

## @evidence contracts/development/implementation.md#principled-implementation

The model determines overall length and mass, and the handle diameter determines its grip. A fixed planar head carries the contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

Selects one model, draws one handle diameter and builds the shared cylindrical handle and flat head.

# src/props/AutoMovieArchetypeShavingRazor.ts#AutoMovieArchetypeShavingRazor.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Specifies scene identity and the stable default.

# src/props/AutoMovieArchetypeShavingRazor.ts#AutoMovieArchetypeShavingRazor.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

Names both valid razor model IDs and the default.

# src/props/AutoMovieArchetypeShavingRazor.ts#AutoMovieArchetypeShavingRazor.IParams.width

## @evidence contracts/development/common.md#meaningful-documentation

Names the metric handle diameter and the applicable band.

# src/props/AutoMovieArchetypeShavingRazor.ts#AutoMovieArchetypeShavingRazor.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Locates the handle grip and upward cartridge face.

## @evidence contracts/development/design.md#principled-representation

The handle width controls the grip aperture and the separate top plane spans the cartridge.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two names distinguish the actual roles of the handle and working head.

# src/props/AutoMovieArchetypeShavingRazor.ts#AutoMovieArchetypeShavingRazor.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines overall length, handle diameter and recorded model mass in their units.

## @evidence contracts/development/design.md#principled-representation

Length and diameter drive the physical shape in metres and the model fixes mass in kilograms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three keys describe the measured geometry and mass used by the razor.

# src/props/AutoMovieArchetypeShavingRazor.ts#AutoMovieArchetypeShavingRazor.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the optional ID, handle diameter and either catalogue option.

## @evidence contracts/development/design.md#principled-representation

One model fixes the correlated length and mass. The author can otherwise tune the gripped diameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps measured length and mass under catalogue ownership and exposes scene identity and grip fit.
