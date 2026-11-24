# src/human/skeleton/IAutoMovieHumanNeutral.ts#IAutoMovieHumanNeutral

## @evidence contracts/development/common.md#meaningful-documentation

Bind-derived neutral joint placements, world turns and clinical segment frames. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IOutput, IFrame, ISource, OfSource declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IOutput, IFrame, ISource, OfSource separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanNeutral exchanges the named IOutput, IFrame, ISource, OfSource contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/skeleton/IAutoMovieHumanNeutral.ts#IAutoMovieHumanNeutral.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

A body's neutral.

## @evidence contracts/development/design.md#principled-representation `joints`: The skeleton standing at neutral, in the bind's order, mm. `turns`: Each bone's world turn from bind to neutral: the achieved offset, inverted. `resting`: Each upper arm's and thigh's resting abduction from the plumb line, degrees, by bone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanNeutral.of, AutoMovieHumanNeutral.derive. Read by AutoMovieHumanJointTurn.derive, AutoMovieHumanPreparedKinematics.prepare. Also types AutoMovieHumanBindingInputs.neutral, AutoMovieHumanNeutral.CACHE.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `joints`, `turns`, `resting`, `forearms`; callers supply the complete record.

# src/human/skeleton/IAutoMovieHumanNeutral.ts#IAutoMovieHumanNeutral.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

One bone's segment frame at neutral.

## @evidence contracts/development/design.md#principled-representation `bone`: Bone id. `parent`: Parent bone, or null for the root. `centre`: Joint centre, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanNeutral.frames.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bone`, `parent`, `centre`, `end`, `axes`; callers supply the complete record.

# src/human/skeleton/IAutoMovieHumanNeutral.ts#IAutoMovieHumanNeutral.ISource

## @evidence contracts/development/common.md#meaningful-documentation

What a body's neutral is derived from: its skin's rings and its bind skeleton.

## @evidence contracts/development/design.md#principled-representation `rings`: The skin as rings; at least the chains {@link READS} names. `joints`: The bind skeleton.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanNeutral.of from the caller's supplied source.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `rings`, `joints`; callers supply the complete record.

# src/human/skeleton/IAutoMovieHumanNeutral.ts#IAutoMovieHumanNeutral.OfSource

## @evidence contracts/development/common.md#meaningful-documentation

Supplies the rings and bind skeleton for one neutral derivation.

## @evidence contracts/development/design.md#principled-representation

The callable takes no arguments and returns the exact ISource used by the current derivation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanNeutral.OfSource is the canonical exchange used by AutoMovieHumanNeutral.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies one source per request. The compatibility entry point invokes it directly and keeps no source or result.
