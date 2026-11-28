# src/vehicles/AutoMovieArchetypeCanoePaddle.ts#AutoMovieArchetypeCanoePaddle.create

## @evidence contracts/development/common.md#meaningful-documentation

The contract locates the shaft and T-grip, their local axes, the blade tip and the fixed 56-inch reference.

## @evidence contracts/development/implementation.md#principled-implementation

A common half-length sets the two ends. The blade grows towards negative X, its tip is the actual wet end, and the T-grip spans Z at the opposite end. The two grips have different axes for the corresponding hands.

## @evidence contracts/development/implementation.md#efficient-algorithms

The construction resolves one fixed dimension record, builds one shaft, one T-grip and one blade, and records the three contact sites once.

# src/vehicles/AutoMovieArchetypeCanoePaddle.ts#AutoMovieArchetypeCanoePaddle.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

The fixed manufacturer reference records the 56-inch envelope, blade dimensions and product mass.

# src/vehicles/AutoMovieArchetypeCanoePaddle.ts#AutoMovieArchetypeCanoePaddle.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The optional ID identifies the instance and defaults to `canoePaddle`.

# src/vehicles/AutoMovieArchetypeCanoePaddle.ts#AutoMovieArchetypeCanoePaddle.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

The record gives metres for lengths and kilograms for mass.

# src/vehicles/AutoMovieArchetypeCanoePaddle.ts#AutoMovieArchetypeCanoePaddle.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The identifiers name the lower shaft and top T-grip and the blade endpoint.

## @evidence contracts/development/design.md#principled-representation

The hands use distinct grip frames and the blade tip is a separate edge face. The canoe stroke reads those roles explicitly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The paddle determines its own frame geometry while the motion law assigns the grip duties.

# src/vehicles/AutoMovieArchetypeCanoePaddle.ts#AutoMovieArchetypeCanoePaddle.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The dimension keys carry the overall and blade dimensions in metres and product mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

The catalogue bands fix the paddle length, blade length and blade width as separate coordinates used in construction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The measured envelope and mass belong to the reference paddle. The staged shaft size remains a construction choice.

# src/vehicles/AutoMovieArchetypeCanoePaddle.ts#AutoMovieArchetypeCanoePaddle.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The inputs accept an optional subject ID and exact reference values.

## @evidence contracts/development/design.md#principled-representation

An explicitly saved value must equal the corresponding fixed band figure. Missing values resolve to the same figures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The optional overrides preserve a recorded reference without widening the recipe's geometry.
