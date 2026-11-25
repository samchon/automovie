# src/human/generation/IAutoMovieHumanTrunkReliefNet.ts#IAutoMovieHumanTrunkReliefNet.Base

## @evidence contracts/development/common.md#meaningful-documentation

The chart's base surface: the body point at a station and a phase, with the stations its windows stay within, the chart's two shared ends.

## @evidence contracts/development/design.md#principled-representation

The chart's base surface: the body point at a station and a phase, with the stations its windows stay within, the chart's two shared ends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`AutoMovieHumanTrunkFeatures.baseSurface` supplies the callable and its station preparation. `AutoMovieHumanTrunkReliefNet.fromFeature` prepares a fixed station for each active net row, then uses the same section for its phase columns.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The phase function retains only the requested station's section controls for its row. Callers that supply the direct point function can use the same bounded net operator.

# src/human/generation/IAutoMovieHumanTrunkReliefNet.ts#IAutoMovieHumanTrunkReliefNet.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

Where the feature lies on the chart.

## @evidence contracts/development/design.md#principled-representation `stations`: The footprint's station range, mm. `phases`: The footprint's phase range, radians, increasing. `apex`: The apex's place in the footprint as fractions of each range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanTrunkReliefNet.fromFeature.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stations`, `phases`, `apex`; callers supply the complete record.
