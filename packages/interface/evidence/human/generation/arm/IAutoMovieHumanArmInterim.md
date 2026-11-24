# src/human/generation/arm/IAutoMovieHumanArmInterim.ts#IAutoMovieHumanArmInterim

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanArmInterim exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups ISitesPlacement. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanArmInterim; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the ISitesPlacement contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/arm/IAutoMovieHumanArmInterim.ts#IAutoMovieHumanArmInterim.ISitesPlacement

## @evidence contracts/development/common.md#meaningful-documentation

The arm's site laws.

## @evidence contracts/development/design.md#principled-representation `projection`: Vertical acromion-to-GH separation, calibration millimetres. `humerus`: Rigid shoulder-to-elbow centre distance, calibration millimetres. `calipers`: Forearm and wrist skin depths and breadths, world millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmInterim.ISitesPlacement is the canonical exchange used by AutoMovieHumanArmInterim.sites.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

`projection` and `humerus` address the biceps tape. The optional `calipers` supply the source extents at the forearm and wrist. A tape-only caller supplies circular sections at those sites.
