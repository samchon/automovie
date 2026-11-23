# src/architecture/IAutoMovieAssemblyReveal.ts#IAutoMovieAssemblyReveal

## @evidence contracts/development/design.md#principled-representation

Measures each lining as the unbroken run of `wrapsOpening` layers from one face, so only layers that can physically turn the jamb count, and deducts `first + last` from each side of both structural dimensions, refusing a result that is not above zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returns the finished size with the depths it was derived from and the lining layer ids, so a caller can dimension the opening, draw the lining returns and report the bare jamb from one call.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Deducting both face linings on every jamb is the producer's pinned rule and is conservative where the two linings sit at different depths; it is stated rather than adjusted per fixture, and a consuming lining throws instead of returning a clamped size.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, that `first` and `last` sum unbroken wrapping runs from each face, that `inset` is their sum taken off each side of width and height, that `width` and `height` stay above zero because consumption throws, and the metre unit of every length.
