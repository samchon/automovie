# src/analysis/IAutoMovieHemisphereDirections.ts#IAutoMovieHemisphereDirections.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Deterministic cosine-weighted unit directions over the hemisphere around `normal`, `count` of them in index order. Member documentation states the supplied records, units and absence meanings used by autoMovieHemisphereDirections.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Plain numbers do not bound allocation or prove a usable normal; the direction generator owns those numeric checks and count has no upper allocation cap.

## @evidence contracts/development/design.md#principled-representation

normal determines the hemisphere axis and count determines the ordered sample population; autoMovieHemisphereDirections normalizes a finite usable axis and requires a positive safe-integer count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieHemisphereDirections.IProps, used by autoMovieHemisphereDirections. Its normal, count members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
