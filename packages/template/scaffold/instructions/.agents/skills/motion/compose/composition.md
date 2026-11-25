# Composing a performance

Compose each beat as a kinematic performance from the actions, parameters and operators of `@automovie/motions`, reading their JSDoc.

## Actions

### Action axes

<!-- @source [FIBA Level 1 coaching manual](https://assets.fiba.basketball/image/upload/documents-corporate-wabc-coaching-level-manuals-level-1-eng.pdf), §2.1.1, illustrates an off-ball cut that opens space for a teammate. -->

For each [beat element](../staging.md#reading-the-scene) a person performs, settle these axes from the beat record and its [performance study](../../story/planning/research.md#performance-study), top to bottom, because each narrows the next:

| Axis | Settle |
| --- | --- |
| Base | What carries the body: the floor, a seat, a wall, a bar, water, a moving vehicle or mount, or another person |
| Travel | Whether and where the body travels, at what gait, and its spacing from a partner or target |
| Action | The vocabulary's action, and its named entry where the action has a table of them |
| Effector | The hand, fingers, foot or other part that performs it or bears weight, and what each hand already holds |
| Target | What the action reaches, with the contact site on it |
| Object | The object involved and how the body relates to it |
| Partner | The performer's role where several perform one action |
| Force | What acts on the body from outside, such as a hit, shove, load or slip, and the outcome the beat decides |
| Manner | Effort, pace, count and how long it is held |
| Layer | What runs under everything the person does, such as gaze, breathing, listening or a mood |
| Timing | When it happens against other actions, partners, hits, commands, dialogue and beats |

Author those axes through the installed operators. Set each parameter that carries a settled axis, and omit it only when its default performs that setting. Leave joint fitting and contact response to their package owners. Resolve a missing story choice in the screenplay under [concretization](../../story/correction/repair.md#concretization).

Use layers for ongoing breathing and listener gaze unless the beat changes them. When one person's move changes another's options, compose the cue and the other person's choice together. Sync reactions to their cause using the law's studied reaction time where available.

Match travel to the visible steps. Carry speed through an intermediate mark on a continuing run. Give a stop or turn the support and weight transfer it needs.

### Prepared motion

The vocabulary prepares each action once and then reads its pose as a pure function of time, so any time read in any order gives the same pose. Preparation keeps only the knots the motion needs: every contact change, impact and touchdown is a branch knot, and further knots are added only until the path meets the action's bound. Minimum-jerk segments timed to the body's limits join the knots, each of which may carry its own acceleration and dwell. Physics runs only for the short response at a branch point. Settle every contact, hit and touchdown the beat needs in the axes above, because each one is a branch the vocabulary plans.

### Forces and outcomes

Pass the scripted outcome and any external force to the action that owns the response. Handle infeasible outcomes under [refusals](refusals.md).

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
| A target on an object's [affordance](../../development/entities.md#objects) | An action on an object |
| A sync between the named instants | An action timed to something else |

A cut ends its action at a time or proximity within a declared window. An overlay uses parts yielded by the action that moves the body. A layer is additive.

A mutual join plans roles from a shared meeting. A sync aligns named instants, including events from dialogue or music cues.

Use an admitted interruption when the beat overlaps actions. For example, initiate a handover as the carrier stops, transfer the prop during the two-handed grip window, and keep it held into the receiver's next action. Carry through the resolved entry state under [declared cuts](../laws/transitions.md#declared-cuts).

## Crowds and variation

### Groups

Use the vocabulary's group capability. The screenplay gives the group action and the affected count or studied rate. Seed and performer traits vary how and when each member acts under [independent draws](../laws/variation.md#independent-draws).

### Seed

Derive variation from the film's [seed](../../development/modules.md#how-the-parts-work-together), person and action. Use a different seed or parameter for another take under [one module](../../development/modules.md#one-module).

## Handoff

A cast or crowd entity's capability returns the composition, as [modules](../../development/modules.md#how-the-parts-work-together) sets.
