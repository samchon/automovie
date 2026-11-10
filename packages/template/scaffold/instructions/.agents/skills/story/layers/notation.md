# Scene and performance notation

Unless the commission adopts another form, use conventional screenplay blocks: a scene heading such as `INT. LOCATION - DAY`, short present-tense action paragraphs of what can be seen or heard, and a consistent speaker cue before each dialogue block, as the [BBC format](https://downloads.bbc.co.uk/writersroom/scripts/screenplay.pdf) and [Final Draft elements](https://www.finaldraft.com/learn/screenplay-formatting-elements/) show. Break paragraphs at changes of action, response or attention, and mark off-screen speech, voiceover, overlap, screen text and time shifts where they would otherwise be ambiguous.

Read the blocks as a continuous sequence, each entry following the preceding exit; final duration comes from the performed action, speech, pauses and edit.

## Identities {#identities}

The H1 names the film, each H2 is a scene and each H3 a beat, every heading with an explicit anchor such as `{#s03}` and `{#s03-b04}`. Headings are addresses for code, evidence and reviews; they prescribe neither shot boundaries nor duration.

Never reuse or renumber an anchor: a removed scene or beat keeps its heading over the single line `OMITTED`, and an inserted one takes a new anchor such as `{#s03-b04a}`, so an existing citation never silently points at different content.

## Records {#records}

Directly under the scene heading, a breakdown list names by settings or brief link everything the scene's beats use, in these categories: cast, crowds, props, sets, wardrobe and makeup state, effects, sound, camera and lighting. Each beat's action and dialogue blocks end with its beat record:

```markdown
### Mara cues the lift {#s03-b04}

<action and dialogue blocks>

- Cast: [Mara](../settings/cast/mara.md#lead-hand), [Jun](../settings/cast/jun.md#hesitates-before-jumps)
- Intent: Mara cues a lift with a press of her hand; Jun reads it a beat late.
- Outcome: the lift lands short, as [the partnering table](../../research/dance/lifts.md#outcomes) allows for a late read.
- Consequence: Mara braces under Jun's weight; Jun lands off balance; Jun's sleeve tears at the seam.
- Space: the pair drifts from centre stage toward the downstage wing; the conductor turns to follow them.
- Camera: medium two-shot, eye level, slow push in.
- Sound: dialogue none; foley shoe scuffs and fabric; ambience hall air; effects none; music VI the on-stage quartet continues.
- Continuity: Jun's left shoe, loosened in s02-b07, is still untied.
```

Music names its usage: `BI` background instrumental, `BV` background vocal, `VI` visual instrumental and `VV` visual vocal, a source the picture shows. A layer with nothing in it says `none`, because silence is a decision.

Breakdown and beat records are notation, like scene headings: expression review does not judge them as prose, and the expression pass rewrites the blocks around them and keeps their decisions.
