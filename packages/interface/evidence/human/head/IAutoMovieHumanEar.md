# src/human/head/IAutoMovieHumanEar.ts#IAutoMovieHumanEar

## @evidence contracts/development/common.md#meaningful-documentation

One auricle, measured on the living head held in the Frankfort plane.

## @evidence contracts/development/design.md#principled-representation `length`: Ear length: superaurale, the highest point of the helix, to subaurale, the lowest point of the lobule, millimetres. `breadth`: Ear breadth: otobasion superius, where the helix leaves the scalp, to the most posterior point of the helix, perpendicular to the long axis, millimetres. `protrusion`: Protrusion: distance of the helix rim from the scalp behind it at the level of the tragus, millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanEarPlace.aboveTragion, AutoMovieHumanEarPlace.concha, AutoMovieHumanHeadCanonical.of. Also types AutoMovieHumanHeadAnatomy.EAR, AutoMovieHumanHeadPose.top.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `length`, `breadth`, `protrusion`; callers supply the complete record.
