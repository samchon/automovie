# src/kinematics/AutoMovieHumanoidSurfaceRegions.ts#AutoMovieHumanoidSurfaceRegions

## @evidence contracts/development/common.md#meaningful-documentation

States what the table holds and who reads it.

## @evidence contracts/development/design.md#principled-representation

A station (a bone, a joint it leans toward, a share) and a direction per region, both sides from one table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The station and definition records and the table the resolver reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keys are the interface's closed region union.

# src/kinematics/AutoMovieHumanoidSurfaceRegions.ts#AutoMovieHumanoidSurfaceRegions.ILevel

## @evidence contracts/development/common.md#meaningful-documentation

Names the interface record this owner's name stands for.

## @evidence contracts/development/design.md#principled-representation

The record is the interface's; the alias adds nothing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept so this owner's readers name the record by its owner, as master keeps such aliases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No copy of the record: one declaration, in `@automovie/interface`.
