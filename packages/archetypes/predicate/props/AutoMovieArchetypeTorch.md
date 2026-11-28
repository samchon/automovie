# src/props/AutoMovieArchetypeTorch.ts#AutoMovieArchetypeTorch.create

## @evidence contracts/development/common.md#meaningful-documentation

States complete selectable models, default length and mass, and the grip, lens and button frames.

## @evidence contracts/development/implementation.md#principled-implementation

The catalogue fixes geometry and mass as one record. The barrel, wider head and inward switch are located from that measured frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds two cylinders from one model choice and positions three contacts using closed-form offsets.

# src/props/AutoMovieArchetypeTorch.ts#AutoMovieArchetypeTorch.HEAD

## @evidence contracts/development/common.md#meaningful-documentation

Gives the estimated axial head size and physical unit.

# src/props/AutoMovieArchetypeTorch.ts#AutoMovieArchetypeTorch.HEAD_DIAMETER

## @evidence contracts/development/common.md#meaningful-documentation

Gives the shared head diameter for both catalogue choices.

# src/props/AutoMovieArchetypeTorch.ts#AutoMovieArchetypeTorch.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

States the stable flashlight scene ID default.

# src/props/AutoMovieArchetypeTorch.ts#AutoMovieArchetypeTorch.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

Names the selection rule and default 2-cell row.

# src/props/AutoMovieArchetypeTorch.ts#AutoMovieArchetypeTorch.MODELS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies whole battery-inclusive measurements and the selected default model.

# src/props/AutoMovieArchetypeTorch.ts#AutoMovieArchetypeTorch.PRESS

## @evidence contracts/development/common.md#meaningful-documentation

Quantifies the authored distance of inward switch travel.

# src/props/AutoMovieArchetypeTorch.ts#AutoMovieArchetypeTorch.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

States that both complete models use a shared physical unit table.

# src/props/AutoMovieArchetypeTorch.ts#AutoMovieArchetypeTorch.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the barrel grasp, forward aim and button travel contacts.

## @evidence contracts/development/design.md#principled-representation

The lens faces along the tube and the outside button presses inward toward the barrel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The named set exposes the three concrete sites built by the prop.

# src/props/AutoMovieArchetypeTorch.ts#AutoMovieArchetypeTorch.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines barrel diameter and tail-to-lens length in metres and mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

The two physical dimensions locate the cylinder and lens. The recorded mass includes batteries.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three measurement keys describe the entire maker-supplied flashlight case.

# src/props/AutoMovieArchetypeTorch.ts#AutoMovieArchetypeTorch.Figures

## @evidence contracts/development/common.md#meaningful-documentation

Explains the three measured quantities recorded together per model.

## @evidence contracts/development/design.md#principled-representation

The catalogue preserves the relationship between the selected flashlight's measured geometry and mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the shared dimension keys for both complete model records.

# src/props/AutoMovieArchetypeTorch.ts#AutoMovieArchetypeTorch.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the scene identity, accepted model choice and ownership of the recorded measurements.

## @evidence contracts/development/design.md#principled-representation

The existing serialized parameter shape is broad, and model admission rejects overrides of complete catalogue dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the scene ID and model selector as the effective authorable controls while preserving the saved input type.

# src/props/AutoMovieArchetypeTorch.ts#AutoMovieArchetypeTorch.Model

## @evidence contracts/development/common.md#meaningful-documentation

Names the Maglite configurations and their exact stored IDs.

## @evidence contracts/development/design.md#principled-representation

The two exact labels select distinct flashlight lengths and masses with the same barrel diameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two literals match the actual complete rows owned by the factory.
