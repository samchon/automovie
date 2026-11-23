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

Read by AutoMovieHumanNeutral.of. Also types AutoMovieHumanNeutral.read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `rings`, `joints`; callers supply the complete record.

# src/human/skeleton/IAutoMovieHumanNeutral.ts#IAutoMovieHumanNeutral.OfSource

## @evidence contracts/development/common.md#meaningful-documentation

One calibrated body's neutral, derived at its first request and shared by every later one.

## @evidence contracts/development/design.md#principled-representation

One calibrated body's neutral, derived at its first request and shared by every later one. The callable takes  and returns ISource.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanNeutral.OfSource is the canonical exchange used by AutoMovieHumanNeutral.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanNeutral.of for one calibrated body's neutral, derived at its first request and shared by every later one.
