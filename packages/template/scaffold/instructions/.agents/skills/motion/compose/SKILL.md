---
name: motion-compose
description: Turns each screenplay beat into every person's composition in the installed motion vocabulary, and repairs what an installed package refuses. Use when composing a performance or when a composition is refused.
---

# Compose a performance

How a screenplay beat becomes each person's composition in the installed motion vocabulary: its actions, with their parameters, joined by its operators. The vocabulary's README and public types own every call and value this page names by role, so read them under [reading a package](../../development/reuse.md#reading-a-package) before writing one.

## Decide each action

For each thing a person does in the beat, settle these axes from the beat record and its [performance study](../../story/planning/research.md#performance-study), top to bottom, because each narrows the next:

| Axis | Settle |
| --- | --- |
| Base | What carries the body, such as the floor it stands on, a seat, the ground it kneels or lies on, a wall it leans on, a bar it hangs from or a mount that moves |
| Travel | Whether the body travels, where to and at what gait |
| Action | Which action of the vocabulary it is, and which named entry where the action has a table of them, such as a kind of gesture, touch or task |
| Effector | Which hand, foot or other part of the body performs it, and what each hand already holds |
| Target | A region of another person or of the performer's own body, a place on an object, a point in the world or none, and the site of contact on it |
| Object | The object it involves and how the body relates to it: holding it, using it, resting on it, carrying it or riding it |
| Partner | The performer's role where two or more perform one action together, such as giver and receiver or leader and follower |
| Manner | How it is performed: its effort, pace and count, and how long it is held |
| Layer | What runs under everything the person does, such as gaze, breathing, listening or a mood |
| Timing | When it happens against other actions, partners, dialogue and beats |

Write those decisions as the composition and nothing else. A value the beat does not decide stays at the action's default, because the default is the studied value and a guessed number is not.

A decision the beat left vague is made in the screenplay, under [concretization](../../story/correction/repair.md#concretization).

## Join the actions

The vocabulary joins actions with a few operators:

| The beat shows | Operator |
| --- | --- |
| One action, then the next | A sequence |
| An action that ends early, at a moment or when something comes near | A cut on that action, inside a window it declares |
| One person doing two things at once, such as reading while walking | An overlay: the action that moves the body carries, and the other takes the parts the carrier yields |
| Something running under everything a person does | A layer, which adds to every action and takes no part away from one |
| Several people each doing their own thing at once | Their compositions in parallel |
| Two or more people performing one action together, such as a handshake, a handover or a lift | A mutual join, which plans every role from one meeting |
| An action on an object, such as sitting on it, gripping it, opening it or riding it | Attaching the action to the object's [affordance](../../development/entities.md#objects) |
| An action timed to another's instant, a partner, a line of dialogue or a beat | A sync between the named instants |

An action that follows, chases, escorts or meets a moving person reads where that person goes, so compose the person pursued before the pursuer; the vocabulary refuses the read otherwise.

## Seed

Every performance takes the film's [one seed](../../development/source-layout.md#how-the-parts-work-together). The vocabulary draws each variation from the seed, the person and the action, so people given the same action already differ and a crowd needs no offsets set by hand.

Another take of an action is another seed or parameter, never a copied composition, under [one module](../../development/reuse.md#one-module).

## Hand it on

A cast entity's capability returns the composition and a scene joins capabilities, as [source layout](../../development/source-layout.md#how-the-parts-work-together) sets.

A composition the vocabulary cannot perform is refused when the performance is built. Repair it under [refusals](refusals.md), and accept one that plans in its [catalog case](../catalog-cases.md).
