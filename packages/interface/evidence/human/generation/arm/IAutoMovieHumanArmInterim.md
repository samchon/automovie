# src/human/generation/arm/IAutoMovieHumanArmInterim.ts#IAutoMovieHumanArmInterim.ISitesPlacement

## @evidence contracts/development/common.md#meaningful-documentation

The arm's site laws.

## @evidence contracts/development/design.md#principled-representation `projection`: Vertical acromion-to-GH separation, calibration millimetres. `humerus`: Rigid shoulder-to-elbow centre distance, calibration millimetres. `calipers`: Forearm and wrist skin depths and breadths, world millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmInterim.ISitesPlacement is the canonical exchange used by AutoMovieHumanArmInterim.sites.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

`projection` and `humerus` address the biceps tape. The optional `calipers` supply the source extents at the forearm and wrist. A tape-only caller supplies circular sections at those sites.
