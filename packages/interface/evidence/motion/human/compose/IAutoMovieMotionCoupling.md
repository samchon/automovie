# src/motion/human/compose/IAutoMovieMotionCoupling.ts#IAutoMovieMotionCoupling

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is; each member gives its meaning, frame and unit. load: The share of the borne weight it carries, in [0, 1]; a grip carries none.

## @evidence contracts/development/design.md#principled-representation

A coupled contact is a part of one body on a region of the other with a load share, the support model of #3425 between two people; the carried mass and its centre are what the bearer's moment balance (#3431) reads. load: The share of the borne weight it carries, in [0, 1]; a grip carries none.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two role names, the contacts, the borne mass and centre, and the borne body's key frame, legs and bearer's stance. Runtime boundary references: lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.kind, return); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.couple, return); lexicon/HumanCarriedCouplingLoad.ts (HumanCarriedCouplingLoad.load, coupling); lexicon/HumanCarriedCouplingLoad.ts (HumanCarriedCouplingLoad.lean, coupling); lexicon/HumanCarriedCouplingLoad.ts (HumanCarriedCouplingLoad.standing, coupling); lexicon/HumanCarriedCouplingLoad.ts (HumanCarriedCouplingLoad.bearable, coupling).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The frames are bearer bones' own (the anchor bone's), so the record is plain data that survives a move of the pair and keeps no body. Shares the canonical IAutoMovieMotionHumanContactWindow, AutoMovieHumanoidRegion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionCoupling.ts#IAutoMovieMotionCoupling.IContact

## @evidence contracts/development/common.md#meaningful-documentation

Each member gives its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

A part and its region on one body, the other body's role and region it lies on, how it bears and its load share: a contact window between two people.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members, the ones a borne law turns into its windows and a bearer into its holds and its balance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The part and the kind are the contact window's own unions.
