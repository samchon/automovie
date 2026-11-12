# Compose a performance

How a screenplay beat becomes each person's composition in the installed motion vocabulary. The vocabulary's README and public types own every call and value this page names by role, so read them under [reading a package](../development/reuse.md#reading-a-package) before writing one.

An act is what a beat has one person do, and an action is one entry of the vocabulary. An act is one action with its parameters, or several actions joined.

## Decide the act {#decide-the-act}

For each person in the beat, settle the act on these axes from the beat record and its [performance study](../story/planning/research.md#performance-study), top to bottom, because each narrows the next:

| Axis | Settle |
| --- | --- |
| Base | What carries the body, such as the floor it stands on, a seat, the ground it kneels or lies on, a wall it leans on, a bar it hangs from or a mount that moves |
| Travel | Whether the body travels, where to and at what gait |
| Action | Which action performs the act, and which named entry where the action has a table of them, such as a kind of gesture, touch or task |
| Effector | Which hand, foot or other part of the body acts, and what each hand already holds |
| Target | A region of another person or of the performer's own body, a place on an object, a point in the world or none, and the site of contact on it |
| Object | The object the act involves and how the body relates to it: holding it, using it, resting on it, carrying it or riding it |
| Partner | The performer's role where two or more perform one act together, such as giver and receiver or leader and follower |
| Manner | How the act is performed: its effort, pace and count, and how long it is held |
| Layer | What runs under everything the person does, such as gaze, breathing, listening or a mood |
| Timing | When the act happens against other acts, partners, dialogue and beats |

Write those decisions as the composition and nothing else. A value the beat does not decide stays at the action's default, because the default is the studied value and a guessed number is not.

A decision the beat left vague is made in the screenplay, under [concretization](../story/correction/repair.md#concretization).

## Join the acts {#join-the-acts}

The vocabulary joins acts with a few operators:

| The beat shows | Operator |
| --- | --- |
| One act, then the next | A sequence |
| An act that ends early, at a moment or when something comes near | A cut on that act, inside a window the action declares |
| One person doing two things at once, such as reading while walking | An overlay: the act that moves the body carries, and the other takes the parts the carrier yields |
| Gaze, breathing or a mood under everything a person does | A layer, which adds to every act and takes no part away from one |
| Several people each doing their own thing at once | Their compositions in parallel |
| Two or more people performing one act together, such as a handshake, a handover or a lift | A mutual join, which plans every role from one meeting |
| An act on an object, such as sitting on it, gripping it, opening it or riding it | Attaching the act to the object's [affordance](../development/entities.md#objects) |
| An act timed to another act's instant, a partner, a line of dialogue or a beat | A sync between the named instants |

## Seed

Every performance takes the film's [one seed](../development/source-layout.md#how-the-parts-work-together). The vocabulary draws each variation from the seed, the person and the act, so people given the same act already differ and a crowd needs no offsets set by hand.

Another take of an act is another seed or parameter, never a copied composition, under [one module](../development/reuse.md#one-module).

## Hand it on

A cast entity's capability returns the composition and a scene joins capabilities, as [source layout](../development/source-layout.md#how-the-parts-work-together) sets.

A composition the vocabulary cannot perform is refused when the performance is built. Repair it under [refusals](refusals.md), and accept one that plans in its [catalog case](catalog-cases.md).
