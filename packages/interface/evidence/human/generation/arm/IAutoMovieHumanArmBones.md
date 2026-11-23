# src/human/generation/arm/IAutoMovieHumanArmBones.ts#IAutoMovieHumanArmBones.IBones

## @evidence contracts/development/common.md#meaningful-documentation

One side's arm landmarks, left frame.

## @evidence contracts/development/design.md#principled-representation `shoulder`: Glenohumeral centre. `elbow`: Elbow centre. `radiale`: Radiale, the radial head's upper edge, on the forearm's axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmBones.place. Read by AutoMovieHumanArmAxis.walk, AutoMovieHumanArmPieces.inputs, AutoMovieHumanArmWalk.prepare. Also types AutoMovieHumanLimbRest.original, AutoMovieHumanArmLaw.placed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `shoulder`, `elbow`, `radiale`, `stylion`, `wrist`, `upper`, `lower`, `humerus`, `forearm`, `acromionRadiale`, `acromionProjection`; callers supply the complete record.
