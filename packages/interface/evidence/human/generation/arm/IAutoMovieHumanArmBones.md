# src/human/generation/arm/IAutoMovieHumanArmBones.ts#IAutoMovieHumanArmBones

## @evidence contracts/development/common.md#meaningful-documentation

Placed arm landmarks, segment lengths and directions in the left calibration frame. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IBones declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IBones separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanArmBones exchanges the named IBones contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/arm/IAutoMovieHumanArmBones.ts#IAutoMovieHumanArmBones.IBones

## @evidence contracts/development/common.md#meaningful-documentation

One side's arm landmarks, left frame.

## @evidence contracts/development/design.md#principled-representation `shoulder`: Glenohumeral centre. `elbow`: Elbow centre. `radiale`: Radiale, the radial head's upper edge, on the forearm's axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmBones.place. Read by AutoMovieHumanArmAxis.walk, AutoMovieHumanArmPieces.inputs, AutoMovieHumanArmWalk.prepare. Also types AutoMovieHumanLimbRest.original, AutoMovieHumanArmLaw.placed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `shoulder`, `elbow`, `radiale`, `stylion`, `wrist`, `upper`, `lower`, `humerus`, `forearm`, `acromionRadiale`, `acromionProjection`; callers supply the complete record.
