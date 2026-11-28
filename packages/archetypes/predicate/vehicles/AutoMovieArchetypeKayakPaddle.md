# src/vehicles/AutoMovieArchetypeKayakPaddle.ts#AutoMovieArchetypeKayakPaddle.create

## @evidence contracts/development/common.md#meaningful-documentation

The contract locates the two grip and tip sides and gives the adjustable length range, fixed dimensions and default.

## @evidence contracts/development/implementation.md#principled-implementation

Two blades use the same geometry with opposite signs. The grip origins stay 0.27 m to either side of the shaft centre, while the tips use the chosen half-length. The selected shaft length lies in its admitted band.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw resolves the dimensions. The same side loop builds two blades and their four sites around one straight rod.

# src/vehicles/AutoMovieArchetypeKayakPaddle.ts#AutoMovieArchetypeKayakPaddle.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

The length range and fixed blade and mass values come from the straight-shaft reference.

# src/vehicles/AutoMovieArchetypeKayakPaddle.ts#AutoMovieArchetypeKayakPaddle.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The optional ID identifies the instance and defaults to `kayakPaddle`.

# src/vehicles/AutoMovieArchetypeKayakPaddle.ts#AutoMovieArchetypeKayakPaddle.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

The record gives metres for shaft and blade dimensions and kilograms for mass.

# src/vehicles/AutoMovieArchetypeKayakPaddle.ts#AutoMovieArchetypeKayakPaddle.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The identifiers distinguish the two shaft grips and two outer blade tips.

## @evidence contracts/development/design.md#principled-representation

Local X sign is shared by each side's grip and tip, giving the alternate strokes distinct sites without recreating the paddle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The model owns framed hand and blade sites. The plan owns their time-varying pose.

# src/vehicles/AutoMovieArchetypeKayakPaddle.ts#AutoMovieArchetypeKayakPaddle.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The type gives the total and single-blade dimensions in metres and mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

Only overall length varies here. The fixed blade length and chosen half-length determine shaft ends, and blade width determines both tip faces.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The producer exposes the independent catalogue measurements and owns the grip offset.

# src/vehicles/AutoMovieArchetypeKayakPaddle.ts#AutoMovieArchetypeKayakPaddle.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The inputs identify the subject and fixed in-band values.

## @evidence contracts/development/design.md#principled-representation

The band draw checks all fixed values, with one adjustable range and three fixed bands.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Callers fix the adjustable measure and can supply recorded fixed reference values without changing the model family.
