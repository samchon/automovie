# src/human/generation/IAutoMovieHumanBodyCalibration.ts#IAutoMovieHumanBodyCalibration

## @evidence contracts/development/common.md#meaningful-documentation

Shared shape coefficients (theta) of the generated body surface.

## @evidence contracts/development/design.md#principled-representation `stature`: Achieved stature input of the calibration specimen in mm. `chains`: All chains of the tree. `events`: Branch events, at most one per chain end.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmConstruction.add, AutoMovieHumanFootConstruction.add, AutoMovieHumanLegConstruction.apply and AutoMovieHumanBodyLaw.realize. The latter supplies `nailSources` only for digit originals with a retained solid face. AutoMovieHumanBodySurfaceSolids consumes them on those existing faces and returns material geometry for final exterior inspection. Also types AutoMovieHumanBodyPreparation.standing and AutoMovieHumanCrotchBinding.trunk.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `diagnostics`: Contracts the body law's pieces broke while building this calibration, each piece degraded to its base (`construction-levels.md`, Totality and diagnostics). `appendages`: Chains rooted in a closed loop on another chain's surface (an auricle on the head, a limb on the trunk) instead of sharing a contact ring. `merges`: Solid merges and diffs drawn by the solid tessellation (`AutoMovieHumanBodySurfaceSolids`): each a join's blend published as a chain between a host chain and a part chain. `bodies`: Solids built as bodies of trimmed faces (`AutoMovieSolidBody`): merges onto merged hosts, whose rails cross faces, published with `AutoMovieSolidBody.publish`. `skeleton`: The bind skeleton the limbs were lofted on, placed before any limb skin by `AutoMovieHumanSkeletonLaw`. `mouth`: The mouth behind the `mouth` aperture: the lips' contact line, the teeth, the cavity's lining and the tongue, placed by `AutoMovieHumanMouth`. `head`: The head's landmarks as its construction solved them, so parts placed on the head (hair, garments) attach through landmarks instead of coordinates. `trunk`: The trunk's landmarks as its solve placed them, left side: the shoulders' arm arc stands on their glenohumeral centre, so the arm and the skeleton stand on the same centre instead of reading one off the skin. `nails`: The nail plates, one per digit chain: a window of the digit chain's own surface from the plate's root to its free edge, as wide as the plate (`AutoMovieHumanNailPlate`).
