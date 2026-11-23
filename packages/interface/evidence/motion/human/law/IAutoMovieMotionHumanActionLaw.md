# src/motion/human/law/IAutoMovieMotionHumanActionLaw.ts#IAutoMovieMotionHumanActionLaw

## @evidence contracts/development/common.md#meaningful-documentation

family: The action this one is a row of: the same law under another name with some of its parameters fixed, as a salute is a touch. Wherever an action is told apart by what it is (a cancel table's key, a follow-up that continues its own kind, an answer to a kind of attack), a row counts as its family. Absent for an action that is its own. yields: The channels this action lets an overlay take while it carries the body: a walk yields its arms, its hands and its head, so a wave or a phone can be performed during it. A digit yields that digit alone, so an overlay may take a thumb while the other four keep holding. None when absent. demands: The poses this action will hold a prop in, asked before it is planned of the grips an earlier action is still choosing among (`pickUp`): the action's goal postures, computed from its own parameters by the functions its plan reads, so a grip the earlier action takes for them is one this action holds (goal postures planned first, Rosenbaum, Meulenbroek, Vaughan and Jansen 2001; a task's goal pose as a grasp's constraint). Nothing is planned: the action reads only what is known before it is, with the grip weighed (`IAutoMovieMotionHumanActionLaw.IAhead`). Empty when the action asks nothing of the grip, or would refuse whatever the grip; absent when it never asks. back: The point of the tool the pose keeps, metres behind the working point. bound: The most the fitted tool may stray from the pose, metres: the action's own declared quality of it, the bound its plan refuses by. least: A stray the action proved before any search, metres: a lower bound on what any fit of the pose leaves, so the pose is judged no better (an infeasibility certificate). None when absent.

## @evidence contracts/development/design.md#principled-representation

family: The action this one is a row of: the same law under another name with some of its parameters fixed, as a salute is a touch. Wherever an action is told apart by what it is (a cancel table's key, a follow-up that continues its own kind, an answer to a kind of attack), a row counts as its family. Absent for an action that is its own. yields: The channels this action lets an overlay take while it carries the body: a walk yields its arms, its hands and its head, so a wave or a phone can be performed during it. A digit yields that digit alone, so an overlay may take a thumb while the other four keep holding. None when absent. demands: The poses this action will hold a prop in, asked before it is planned of the grips an earlier action is still choosing among (`pickUp`): the action's goal postures, computed from its own parameters by the functions its plan reads, so a grip the earlier action takes for them is one this action holds (goal postures planned first, Rosenbaum, Meulenbroek, Vaughan and Jansen 2001; a task's goal pose as a grasp's constraint). Nothing is planned: the action reads only what is known before it is, with the grip weighed (`IAutoMovieMotionHumanActionLaw.IAhead`). Empty when the action asks nothing of the grip, or would refuse whatever the grip; absent when it never asks. back: The point of the tool the pose keeps, metres behind the working point. bound: The most the fitted tool may stray from the pose, metres: the action's own declared quality of it, the bound its plan refuses by. least: A stray the action proved before any search, metres: a lower bound on what any fit of the pose leaves, so the pose is judged no better (an infeasibility certificate). None when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: law/HumanActionRow.ts (HumanActionRow.of, law); law/HumanActionRow.ts (HumanActionRow.of, return); lexicon/HumanGait.ts (styled, return); striking/StrikingHeld.ts (StrikingHeld.follows, return); lexicon/HUMAN_LEXICON.ts (rows, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieMotionHumanActionKey, IAutoMovieMotionHumanInterruptRow, AutoMovieMotionHumanChannelClaim, IAutoMovieMotionHumanActionContext identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical AutoMovieHumanSide, IAutoMovieMotionHumanStrikingHeld.IPoints, IAutoMovieMotionHumanStrikingHeld.ITool, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanStrikingHeld.IHandFrame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanActionLaw.ts#IAutoMovieMotionHumanActionLaw.IGrip

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it is.

## @evidence contracts/development/design.md#principled-representation

The prop, the hand, the tool the grip would hold, read as a held tool is, and the body as the grasp leaves it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, what a demanding action reads of a grip.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tool is read by its own affordances; no prop is named.

# src/motion/human/law/IAutoMovieMotionHumanActionLaw.ts#IAutoMovieMotionHumanActionLaw.IDemand

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The arguments of the held-tool measure the action's refusal reads, on the posture it shows, with the bound it refuses by.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members, every argument of that refusal and an optional proven lower bound.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The bound is the action's own; none is picked by the reader.

# src/motion/human/law/IAutoMovieMotionHumanActionLaw.ts#IAutoMovieMotionHumanActionLaw.IPlant

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it is and its unit.

## @evidence contracts/development/design.md#principled-representation

The prop by its subject id, its planted end by affordance id and the plant's lean from upright, all the action's own parameters and constants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, what an action cut into the plant reads to carry the prop down to it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No prop or action is named: the prop and its end are the planting action's parameters.

# src/motion/human/law/IAutoMovieMotionHumanActionLaw.ts#IAutoMovieMotionHumanActionLaw.IAhead

## @evidence contracts/development/common.md#meaningful-documentation

States what is known and why nothing else is.

## @evidence contracts/development/design.md#principled-representation

The context's members that do not depend on the action being planned, with the second it is read at and the grip, whose posture is the entry an earlier action predicts for it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a demanding action reads before it is planned.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No other action's entry, start or posture stands in for this one's.
