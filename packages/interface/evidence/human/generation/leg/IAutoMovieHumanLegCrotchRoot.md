# src/human/generation/leg/IAutoMovieHumanLegCrotchRoot.ts#IAutoMovieHumanLegCrotchRoot.IRoot

## @evidence contracts/development/common.md#meaningful-documentation

The crotch ring a leg takes, canonical: the trunk's arc, front pinch first.

## @evidence contracts/development/design.md#principled-representation `arc`: The arc from the front pinch round the outside to the rear pinch. `rates`: The trunk's station derivative at each point of the arc, per mm up. `seconds`: The trunk's second station derivative at each point of the arc, per mm squared.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegCrotchRoot.of. Read by AutoMovieHumanLegCrotchFillet.of, AutoMovieHumanLegCrotchRoot.start. Also types AutoMovieHumanLegChain.root, AutoMovieHumanLegCrotchRoot.root.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `arc`, `rates`, `seconds`, `y`, `centre`, `ring`, `corner`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegCrotchRoot.ts#IAutoMovieHumanLegCrotchRoot.IArcs

## @evidence contracts/development/common.md#meaningful-documentation

The trunk and the phase arcs of its bottom ring that one leg takes.

## @evidence contracts/development/design.md#principled-representation `trunk`: The trunk chain, owner of the ring. `arcs`: The arcs `[from, to]` of the trunk's phases the leg takes, radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegCrotchRoot.arcs. Also types AutoMovieHumanLegCrotchRoot.taken.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `trunk`, `arcs`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegCrotchRoot.ts#IAutoMovieHumanLegCrotchRoot.OfCentre

## @evidence contracts/development/common.md#meaningful-documentation

The crotch ring a leg takes, with the trunk's own jet along it.

## @evidence contracts/development/design.md#principled-representation

The crotch ring a leg takes, with the trunk's own jet along it. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegCrotchRoot.OfCentre is the canonical exchange used by AutoMovieHumanLegCrotchRoot.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegCrotchRoot.of for the crotch ring a leg takes, with the trunk's own jet along it.
