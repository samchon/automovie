# Composing a performance

Compose each screenplay beat with installed actions, parameters and operators. Read the [package API](../../automovie/SKILL.md#reading-a-package) first.

## Actions

### Action axes

For each thing a person does in the beat, settle these axes from the beat record and its [performance study](../../story/planning/research.md#performance-study), top to bottom, because each narrows the next:

| Axis | Settle |
| --- | --- |
| Base | What carries the body: the floor, a seat, a wall, a bar, water, a moving vehicle or mount, or another person |
| Travel | Whether the body travels, where to and at what gait |
| Action | The vocabulary's action, and its named entry where the action has a table of them |
| Effector | The hand, fingers, foot or other part that performs it or bears weight, and what each hand already holds |
| Target | What the action reaches, with the contact site on it |
| Object | The object involved and how the body relates to it |
| Partner | The performer's role where several perform one action |
| Force | What acts on the body from outside, such as a hit, shove, load or slip, and the outcome the beat decides |
| Manner | Effort, pace, count and how long it is held |
| Layer | What runs under everything the person does, such as gaze, breathing, listening or a mood |
| Timing | When it happens against other actions, partners, hits, commands, dialogue and beats |

Choose the action and its target, if any, on a body, object or world point. Set the object's use and each partner's role.

Write those decisions as the composition and nothing else. A value the beat does not decide stays at the action's default, which is the studied value. A decision the beat left vague is made in the screenplay, under [concretization](../../story/correction/repair.md#concretization).

Use layers for ongoing breathing and listener gaze unless the beat changes them, as [blocking](../staging.md#blocking) requires. Sync reactions to their cause. The vocabulary adds studied reaction time.

### Forces and outcomes

The vocabulary moves a body by the forces on it, so give it the force and write no reaction by hand. A strike's hit carries its own force; a force the beat does not size, such as a shove, takes its size from the study.

Pass the scripted outcome to the vocabulary. Handle infeasible outcomes under [refusals](refusals.md).

## Operators

The vocabulary joins actions with a few operators:

| Operator | The beat shows |
| --- | --- |
| A sequence | One action, then the next |
| A cut on the action | An action that ends early |
| An overlay | One person doing two things at once |
| A layer | Something running under everything a person does |
| Parallel compositions | Several people each doing their own thing at once |
| A mutual join | Two or more people performing one action together |
| Attaching the action to the object's [affordance](../../development/entities.md#objects) | An action on an object |
| A sync between the named instants | An action timed to something else |

A cut ends its action at a time or proximity within a declared window. An overlay uses parts yielded by the action that moves the body. A layer is additive.

A mutual join plans roles from a shared meeting. An attach action uses an object connection. A sync aligns action to an event, partner, line, command or beat.

Start a following action inside the window where the previous one lets the next interrupt it, rather than letting each return to rest, because a person begins the next thing before finishing the last.

## Crowds and variation

### Groups

Use the vocabulary's group capability. The screenplay gives the group action and the affected count or studied rate. Seed and performer traits vary how and when each member acts under [independent draws](../laws/variation.md#independent-draws).

### Seed

Derive variation from the film's [seed](../../development/modules.md#how-the-parts-work-together), person and action. Use a different seed or parameter for another take under [one module](../../development/modules.md#one-module).

## Handoff

A cast or crowd entity's capability returns the composition, as [modules](../../development/modules.md#how-the-parts-work-together) sets. A composition the vocabulary cannot perform is refused when the performance is built, and one that plans is accepted in its [catalog case](../catalog-cases.md).
