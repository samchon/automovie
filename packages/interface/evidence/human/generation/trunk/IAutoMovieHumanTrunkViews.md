# src/human/generation/trunk/IAutoMovieHumanTrunkViews.ts#IAutoMovieHumanTrunkViews

## @evidence contracts/development/common.md#meaningful-documentation

The trunk as its views draw it, in calibration millimetres in the body frame (forward +X, up +Y, left +Z): the input of the trunk's view part (`AutoMovieHumanTrunkViewPart`).

The optional shoulder datum names the axillary and acromial levels, the left side-neck point and the acromial distance from the median plane, all in the same frame.

## @evidence contracts/development/design.md#principled-representation `connection`: Actual canonical neck family/frame; both original builders consume this same regular boundary. `perineum`: The perineum: the trunk's bottom pole, where every outline meets at one point. `sites`: The sites, by strictly rising height above the perineum, each a knot of every outline.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkViews.of. Read by AutoMovieHumanTrunkSectionFamily.define, AutoMovieHumanTrunkViewPart.create, AutoMovieHumanTrunkViewPart.define. Also types AutoMovieHumanTrunkBuild.solved, AutoMovieHumanTrunkViews.backProfile.

Body preparation supplies one shoulder datum. The original trunk builder and body lane read it to compose both arms with one common source.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `connection`: Actual canonical neck family/frame; both original builders consume this same regular boundary. `backProfile`: Retained back observations between named sites, calibration mm.

The shoulder record holds anatomical points and measurements. Human derives the opening and the native receiving ring per person and per arm.

# src/human/generation/trunk/IAutoMovieHumanTrunkViews.ts#IAutoMovieHumanTrunkViews.ISite

## @evidence contracts/development/common.md#meaningful-documentation

One site's knots.

## @evidence contracts/development/design.md#principled-representation `site`: The measurement site, such as `chest` or `waist`, named in diagnostics and identity checks. `y`: Height, mm. `half`: Half breadth of the left lateral outline from the median plane, mm, positive.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanTrunkLegs.trial, AutoMovieHumanTrunkSectionFamily.at. Also types AutoMovieHumanTrunkBuild.neck, AutoMovieHumanTrunkViewPart.last.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `sectionBox`: Optional original symmetric local support box, calibration mm, owned before its world placement.
