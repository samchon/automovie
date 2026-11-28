# src/props/AutoMovieArchetypeSwimFin.ts#AutoMovieArchetypeSwimFin.create

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the local heel and toe frame, ankle mounting socket, blade size, seedless values and band refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The upper blade frame sits at the top of the actual blade box. Its width and depth are the exact two dimensions used to size that box and to compute the staged blade area in motion.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each constructor draws one dimension record and makes two boxes and two sites. The geometry stores blade dimensions so motion can read area without traversing the mesh.

# src/props/AutoMovieArchetypeSwimFin.ts#AutoMovieArchetypeSwimFin.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

The record marks the blade size and mass ranges as staging estimates.

# src/props/AutoMovieArchetypeSwimFin.ts#AutoMovieArchetypeSwimFin.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The optional ID names one model and defaults to `swimFin`.

# src/props/AutoMovieArchetypeSwimFin.ts#AutoMovieArchetypeSwimFin.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Length and width are in metres and mass is in kilograms.

# src/props/AutoMovieArchetypeSwimFin.ts#AutoMovieArchetypeSwimFin.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The two identifiers distinguish the ankle socket and the blade upper face.

## @evidence contracts/development/design.md#principled-representation

The `wear` socket locates the pocket over the heel, while the `blade` surface carries the width and depth read by fin motion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One site mounts the fin and one records the blade geometry. Fin motion owns how it uses area.

# src/props/AutoMovieArchetypeSwimFin.ts#AutoMovieArchetypeSwimFin.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

The declaration distinguishes blade dimensions in metres and one fin's mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

Length and width size the blade and its surface. Mass is passed separately to the model builder. The dimension bands admit fixed values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the dimensions read by this recipe are exposed; the foot pocket uses staged construction sizes.

# src/props/AutoMovieArchetypeSwimFin.ts#AutoMovieArchetypeSwimFin.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The inputs accept an optional ID and fixed values from the dimension bands.

## @evidence contracts/development/design.md#principled-representation

The shared draw checks every fixed numeric value against the corresponding staged band's finite bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller chooses which dimensions to fix and the model builder owns the remaining geometry.
