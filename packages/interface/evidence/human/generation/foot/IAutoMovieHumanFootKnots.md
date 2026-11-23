# src/human/generation/foot/IAutoMovieHumanFootKnots.ts#IAutoMovieHumanFootKnots

## @evidence contracts/development/common.md#meaningful-documentation

Closed anatomical region names for forefoot, heel, ankle and plantar-contact guide knots. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only Region declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

Region separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanFootKnots exchanges the named Region contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/foot/IAutoMovieHumanFootKnots.ts#IAutoMovieHumanFootKnots.Region

## @evidence contracts/development/common.md#meaningful-documentation

A guide region.

## @evidence contracts/development/design.md#principled-representation

A guide region. The closed alternatives are "crestForefoot", "crestAnkle", "lateralForefoot", "lateralHeel", "lateralColumn", "medialForefoot", "medialNavicular", "medialColumn", "contactLateralBall", "contactLateralMidfoot", "contactLateralHeel", "contactMedialBall", "contactMedialMidfoot", "contactMedialHeel", "heelCornerLateral", "heelCornerMedial", "achillesLateral", "achillesMedial".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootKnots.knots. Also types AutoMovieHumanFootKnots.GUIDES.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanFootKnots.GUIDES, AutoMovieHumanFootKnots.knots, AutoMovieHumanFootKnots.guide for a guide region.
