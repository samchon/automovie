# Composing a performance

Compose the behavior the beat calls for. Use the installed JSDoc to match supported motion to the performance.

## Choosing movement

Read the performer's intent, skill, circumstances and style in the beat and subject record. Take visible cues, posture, timing, weight transfers and reactions from the [performance study](../../story/planning/research.md#performance-study).

Choose the smallest implementation that performs those details.

1. Use a shipped action or row when its mechanics and defaults fit the beat.
2. Set supported parameters or compose actions for expressible changes.
3. Register a row to reuse a fitted set of parameters with a name.
4. Register a law with [effector goals](../laws/authoring.md) for channels or times with new mechanics.

For example, a startled retreat needs the abrupt reactions and steps observed for that person. A kickboxing backstep carries its own stance and rhythm. A wuxia scene's style comes from the studied performance, including how its cast moves before and after contact. Use a shipped action only where its displayed movement fits that style.

Keep fitted phases around a custom interval and join at admitted events or cuts. Overlay when the carrier yields the required channels and retains root motion and held contacts.

Create a row with `AutoMovieMotionHumanActionRow.of(name, law, fixed)`. Pass rows and custom laws in the `laws` input to `AutoMovieMotionHumanPerformance`. Use `AutoMovieMotionHumanChain.extend` for typed calls under their own names.

## Actions

### Action axes

<!-- @reference [FIBA Level 1 coaching manual](https://assets.fiba.basketball/image/upload/documents-corporate-wabc-coaching-level-manuals-level-1-eng.pdf), §2.1.1, illustrates an off-ball cut that opens space for a teammate. -->

Settle each beat element's axes in order from the beat and study.

| Axis | Settle |
| --- | --- |
| Base | What carries the body |
| Travel | Whether, where, gait and spacing from partner or target |
| Action | Vocabulary action and named entry when it has a table |
| Effector | What acts or bears weight, and what each hand already holds |
| Target | What the action reaches, with the contact site on it |
| Object | The object involved and how the body relates to it |
| Partner | The performer's role where several perform one action |
| Force | External hit, shove, load or slip, and the beat's chosen outcome |
| Manner | Effort, pace, count and how long it is held |
| Layer | Ongoing gaze, breath, listening or mood beneath the action |
| Timing | Relation to other actions, partners, hits, cues, dialogue and beats |

A base can be a floor, seat, wall, bar, water, moving vehicle or mount, or another person. Effectors include hands, fingers and feet.

Set each axis through installed operators. Omit a parameter only if its default performs the choice. Leave joint fitting and contact response to the package owners. Return missing story choices to [concretization](../../story/correction/repair.md#concretization).

Use layers for ongoing breathing and listener gaze unless the beat changes them. When one person's move changes another's options, compose the cue and the other person's choice together. Sync reactions to their cause using the law's studied reaction time where available.

Match travel to the visible steps. Carry speed through an intermediate mark on a continuing run. Give a stop or turn the support and weight transfer it needs.

### Forces and outcomes

Pass the scripted outcome and any external force to the action that owns the response. Handle infeasible outcomes under [refusals](refusals.md).

## Operators

Use the operator for the relationship the beat shows.

| Operator | The beat shows |
| --- | --- |
| Chain or `next` | One action, then the next |
| `until` | End the current action at a legal interruption |
| `over` | Perform a second action on channels the carrier yields |
| Performance layer | Add breathing, gaze or another admitted layer |
| `with` | Play independent chains in parallel |
| `mutual` | Plan the participants' roles in one interaction |
| [Affordance](../../development/entities.md#objects) | Act at a named object site |
| `sync` | Align named action events or cues |

A cut uses an admitted share, event or proximity. Cut or add overlays before syncing. Use the played segment to inspect a cut because the schedule's entry end can retain the action's full duration.

## Continuous joins

Carry the displayed pose, speed, active support and held objects through each join. Bind contact to the material frame that moves it, such as the actual rung or backrest. Keep a grasp until the authored release or transfer. Use the resolved boundary state under [declared cuts](../laws/transitions.md#declared-cuts).

Verify contact onset, bearing, release and ownership at the event and on both sides. Check the supported surface, clearance and any preserved gait phase. Keep intended discontinuities such as impact. Inspect the composed passage at speed in its camera.

## Crowds and variation

### Groups

Use the vocabulary's group capability. The screenplay gives the group action and the affected count or studied rate. Seed and performer traits vary how and when each member acts under [independent draws](../laws/variation.md#independent-draws).

### Seed

Set proficiency and behavior through supported parameters. Use the film seed for bounded variation across takes. Check that different takes preserve the beat's timing constraints, contacts and outcome.

## Handoff

A cast or crowd capability returns the composition.
