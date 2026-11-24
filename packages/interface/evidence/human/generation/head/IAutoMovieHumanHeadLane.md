# src/human/generation/head/IAutoMovieHumanHeadLane.ts#IAutoMovieHumanHeadLane

## @evidence contracts/development/common.md#meaningful-documentation

Prepared head originals and their completed subtree, sharing skeleton, eye and attachment metadata. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IOutput, ISkeleton, IPrepared declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IOutput, ISkeleton, IPrepared separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanHeadLane exchanges the named IOutput, ISkeleton, IPrepared contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/head/IAutoMovieHumanHeadLane.ts#IAutoMovieHumanHeadLane.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

The complete head subtree, its source context and shared records.

## @evidence contracts/development/design.md#principled-representation `root`: The head's subtree, metres. `source`: The same composed source object used to make root; studies remain explicitly outside that tree. The invocation owns `loopSources`, which the tree's shared loop references identify. The host and part charts read the same physical contact in mm and radians. `face`: The head's face the body meets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadLane.create. The neutral head capture and AutoMovieHumanBodyLane.define pass its paired charts to construction realization. Also types AutoMovieHumanBodyLaw.headLane.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `root`, `source`, `loopSources`, `face`, `search`, `radius`, `vermilion`, `cap`, `skeleton`, `eyes`, `landmarks`, `stature`. Each source-backed join resolves its named entry in the same invocation.

# src/human/generation/head/IAutoMovieHumanHeadLane.ts#IAutoMovieHumanHeadLane.ISkeleton

## @evidence contracts/development/common.md#meaningful-documentation

Joint references from the lane's generating neck and head axis.

## @evidence contracts/development/design.md#principled-representation `neckBase`: Actual generating mass axis at the lower overlap height, mm; not a named base-tape point. `occiput`: Head mass's axis at the midpoint of the ears' tragia, mm. `crown`: Head mass's crown pole, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanSkeletonLaw.{ occiput, crown }.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `neckBase`, `occiput`, `crown`, `neckRadius`; callers supply the complete record.

# src/human/generation/head/IAutoMovieHumanHeadLane.ts#IAutoMovieHumanHeadLane.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Canonical original material and records, before regional composition.

## @evidence contracts/development/design.md#principled-representation `source`: Actual canonical mass and neck, without any regional face source. `places`: The same selected laws used for the mass and the regional builders.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadLane.prepare. Read by AutoMovieHumanHeadLane.create. Also types AutoMovieHumanBodyPreparation.head, AutoMovieHumanBodySources.head.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `source`, `places`; callers supply the complete record.
