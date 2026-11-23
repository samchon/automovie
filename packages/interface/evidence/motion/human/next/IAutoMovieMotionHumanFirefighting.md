# src/motion/human/next/IAutoMovieMotionHumanFirefighting.ts#IAutoMovieMotionHumanFirefighting

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Firefighting family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Firefighting laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanFirefighting.ts#IAutoMovieMotionHumanFirefighting.IPass

## @evidence contracts/development/common.md#meaningful-documentation

Names the method it parameterises, the type it extends and the one member it adds.

## @evidence contracts/development/design.md#principled-representation

The extinguisher drill's own members, with the hand the take and the pin's pull use.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Serves this family's `pass` signature.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the drill's members are inherited, not redefined.

# src/motion/human/next/IAutoMovieMotionHumanFirefighting.ts#IAutoMovieMotionHumanFirefighting.IHoseTeam

## @evidence contracts/development/common.md#meaningful-documentation

Names what the team shares and what each member sets.

## @evidence contracts/development/design.md#principled-representation

A named derivation of `IAutoMovieMotionHumanFirefight.IHoseLine` without the two members that differ per member.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `hoseTeam` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is added.

# src/motion/human/next/IAutoMovieMotionHumanFirefighting.ts#IAutoMovieMotionHumanFirefighting.ITeamMember

## @evidence contracts/development/common.md#meaningful-documentation

Names the chain and the place.

## @evidence contracts/development/design.md#principled-representation

A chain and world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `hoseTeam` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both members are required.

# src/motion/human/next/IAutoMovieMotionHumanFirefighting.ts#IAutoMovieMotionHumanFirefighting.Team

## @evidence contracts/development/common.md#meaningful-documentation

Names what it holds and in which order.

## @evidence contracts/development/design.md#principled-representation

A pair of chains.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `hoseTeam` returns.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is added.
