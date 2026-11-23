# src/human/generation/foot/IAutoMovieHumanFootToeSources.ts#IAutoMovieHumanFootToeSources.ICandidate

## @evidence contracts/development/design.md#principled-representation

Keeps the actual generated attachment and distal proxy beside the parallel-plane source that consumes them. `root`: Generating axis centre on the retained metatarsal cascade, mm; not a surface-contact point or measured MTP. `apex`: Generated distal proxy, not an independently observed 3D tip, mm. `part`: The identical fixed foot-chart definition passed to the production toe builder.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A point pair and its view input expose the skin source without inventing a skeletal landmark. Returned by AutoMovieHumanFootToeSources.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Does not label retained normalized placements or loop means as observed joint centres. Required fields are `root`, `apex`, `part`; callers supply the complete record.

## @evidence contracts/development/common.md#meaningful-documentation

States calibration units, point provenance and the absence of anatomical joint identity. One generated toe attachment and its defining parallel-plane part, in calibration mm.
