# src/human/generation/IAutoMovieHumanShoulderCap.ts#IAutoMovieHumanShoulderCap

## @evidence contracts/development/common.md#meaningful-documentation

The outer upper-arm edge at glenohumeral height, with its girth-derived radius. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IEdge declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IEdge separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanShoulderCap exchanges the named IEdge contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanShoulderCap.ts#IAutoMovieHumanShoulderCap.IEdge

## @evidence contracts/development/common.md#meaningful-documentation

The arm's outer edge at the glenohumeral centre's height.

## @evidence contracts/development/design.md#principled-representation `y`: Height of the glenohumeral centre, mm. `z`: Lateral place of the glenohumeral centre, mm. `radius`: The upper arm's girth radius, mm: the biceps tape over 2 pi.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanShoulderCap.extreme, AutoMovieHumanShoulderCap.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `y`, `z`, `radius`; callers supply the complete record.
