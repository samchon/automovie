# src/motion/human/law/IAutoMovieMotionHumanMutual.ts#IAutoMovieMotionHumanMutual

## @evidence contracts/development/common.md#meaningful-documentation

States what a mutual action is, what the record says and who joins the chains. name: The action: a vocabulary name or a registered one. params: Its parameters.

## @evidence contracts/development/design.md#principled-representation

The roles as a closed list of names and each role's action as a function of the shared parameters and the cast, so one statement yields every role's intent. name: The action: a vocabulary name or a registered one. params: Its parameters.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A name, the roles and one function. Runtime boundary references: HumanChain.ts (HumanChain.mutual, mutual); actions/HumanMutual.ts (HumanMutual.handshake); actions/HumanMutual.ts (HumanMutual.highFive); actions/HumanMutual.ts (HumanMutual.handOver); actions/HumanMutual.ts (HumanMutual.kiss); actions/HumanMutual.ts (HumanMutual.pass).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The role names type the cast, so a missing or a misspelt role is refused by the type checker. Shares the canonical AutoMovieMotionHumanActionKey identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanMutual.ts#IAutoMovieMotionHumanMutual.IAct

## @evidence contracts/development/common.md#meaningful-documentation

name: The action: a vocabulary name or a registered one. params: Its parameters.

## @evidence contracts/development/design.md#principled-representation

name: The action: a vocabulary name or a registered one. params: Its parameters.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/HumanMutual.ts (HumanMutual.handshake, return); actions/HumanMutual.ts (HumanMutual.highFive, return); actions/HumanMutual.ts (HumanMutual.handOver, return); actions/HumanMutual.ts (HumanMutual.kiss, return); actions/HumanMutual.ts (HumanMutual.pass, return); lexicon/HumanCoupled.ts (HumanCoupled.carry, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieMotionHumanActionKey identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
