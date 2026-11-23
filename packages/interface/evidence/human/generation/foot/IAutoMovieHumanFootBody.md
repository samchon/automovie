# src/human/generation/foot/IAutoMovieHumanFootBody.ts#IAutoMovieHumanFootBody.IGuides

## @evidence contracts/development/common.md#meaningful-documentation

The five guides a section stands between.

## @evidence contracts/development/design.md#principled-representation `crest`: The instep's crest. `lateral`: The lateral border. `contactLateral`: The lateral edge of the plantar contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootKnots.guides. Also types AutoMovieHumanFootConstruction.guides, AutoMovieHumanFootBody.guides.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `crest`, `lateral`, `contactLateral`, `contactMedial`, `medial`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootBody.ts#IAutoMovieHumanFootBody.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the body reads: the frame, the fan's axes and the five guides.

## @evidence contracts/development/design.md#principled-representation `frame`: The foot's frame. `line`: The fan's axes, levers and stations. `guides`: The guides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootBody.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `diagnostics`: The list a degraded section records into; a part viewer may leave it out. `producer`: The producer named in a diagnostic, such as `foot.left`.

# src/human/generation/foot/IAutoMovieHumanFootBody.ts#IAutoMovieHumanFootBody.IBody

## @evidence contracts/development/common.md#meaningful-documentation

The body: its stations and the section at any station.

## @evidence contracts/development/design.md#principled-representation `stations`: The chain's layer stations, from the web ring to the ankle ring. `fan`: The section planes. `sample`: The section at a station as a loft sample.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootBody.of. Read by AutoMovieHumanFootBodyChain.of, AutoMovieHumanFootMalleolus.of, AutoMovieHumanFootWebRing.of. Also types AutoMovieHumanFootConstruction.body, AutoMovieHumanFootMalleolusWindow.body.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stations`, `fan`, `sample`, `section`, `guide`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootBody.ts#IAutoMovieHumanFootBody.ISection

## @evidence contracts/development/common.md#meaningful-documentation

A section: its ring at its fixed phases and its places across.

## @evidence contracts/development/design.md#principled-representation `ring`: World points at the section's fixed phases. `frame`: The section's plane. `pinches`: Phases on the upper and lower boundaries where the across coordinate is `v`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanFootBody.own, AutoMovieHumanFootBody.near.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `ring`, `frame`, `pinches`, `lateral`, `medial`, `at`; callers supply the complete record.
