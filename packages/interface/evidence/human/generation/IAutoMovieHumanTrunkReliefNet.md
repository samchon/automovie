# src/human/generation/IAutoMovieHumanTrunkReliefNet.ts#IAutoMovieHumanTrunkReliefNet

## @evidence contracts/development/common.md#meaningful-documentation

A trunk-chart base surface and bounded station/phase footprints for local reliefs. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only Base, IWindow declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

Base, IWindow separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanTrunkReliefNet exchanges the named Base, IWindow contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanTrunkReliefNet.ts#IAutoMovieHumanTrunkReliefNet.Base

## @evidence contracts/development/common.md#meaningful-documentation

The chart's base surface: the body point at a station and a phase, with the stations its windows stay within, the chart's two shared ends.

## @evidence contracts/development/design.md#principled-representation

The chart's base surface: the body point at a station and a phase, with the stations its windows stay within, the chart's two shared ends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkFeatures.baseSurface. Read by AutoMovieHumanSpinalGroove.create, AutoMovieHumanSternalNotch.create, AutoMovieHumanTrunkReliefNet.fromFeature. Also types AutoMovieHumanTrunkFeatures.base.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanSpinalGroove.create, AutoMovieHumanSternalNotch.create, AutoMovieHumanTrunkFeatures.baseSurface, AutoMovieHumanTrunkFeatures.base for the chart's base surface: the body point at a station and a phase, with the stations its windows stay within, the chart's two shared ends.

# src/human/generation/IAutoMovieHumanTrunkReliefNet.ts#IAutoMovieHumanTrunkReliefNet.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

Where the feature lies on the chart.

## @evidence contracts/development/design.md#principled-representation `stations`: The footprint's station range, mm. `phases`: The footprint's phase range, radians, increasing. `apex`: The apex's place in the footprint as fractions of each range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanTrunkReliefNet.fromFeature.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stations`, `phases`, `apex`; callers supply the complete record.
