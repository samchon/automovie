# src/human/generation/foot/IAutoMovieHumanFootWebRing.ts#IAutoMovieHumanFootWebRing

## @evidence contracts/development/common.md#meaningful-documentation

Ordered toe arcs of the foot body's ring, with hallux first in left-side phase coordinates. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IWebRing declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IWebRing separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanFootWebRing exchanges the named IWebRing contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/foot/IAutoMovieHumanFootWebRing.ts#IAutoMovieHumanFootWebRing.IWebRing

## @evidence contracts/development/common.md#meaningful-documentation

Each toe's arcs of the ring.

## @evidence contracts/development/design.md#principled-representation `arcs`: Each toe's arcs of the body's ring, left phases, hallux first.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootWebRing.of. Also types AutoMovieHumanFootConstruction.web.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `arcs`; callers supply the complete record.
