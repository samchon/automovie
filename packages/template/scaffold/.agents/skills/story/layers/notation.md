# Scene and performance notation

Unless the commission adopts another form, use conventional screenplay blocks: a scene heading such as `INT. LOCATION - DAY`, short present-tense action paragraphs of what can be seen or heard, and a consistent speaker cue before each dialogue block, as the [BBC format](https://downloads.bbc.co.uk/writersroom/scripts/screenplay.pdf) and [Final Draft elements](https://www.finaldraft.com/learn/screenplay-formatting-elements/) show. Break paragraphs at changes of action, response or attention, and mark off-screen speech, voiceover, overlap, screen text and time shifts where they would otherwise be ambiguous. Read the blocks as a continuous sequence, each entry following the preceding exit; final duration comes from the performed action, speech, pauses and edit.

## Identities {#identities}

The H1 names the film, each H2 is a scene and each H3 a beat, every heading with an explicit anchor such as `{#s03}` and `{#s03-b04}`. Headings are addresses for code, evidence and reviews; they prescribe neither shot boundaries nor duration. Never reuse or renumber an anchor: a removed scene or beat keeps its heading over the single line `OMITTED`, and an inserted one takes a new anchor such as `{#s03-b04a}`, so an existing citation never silently points at different content.

## Records {#records}

Directly under the scene heading, a breakdown list names by settings link everything the scene's beats use, in these categories: cast, crowds, props, sets, wardrobe and makeup state, effects, sound, camera and lighting. Each beat's action and dialogue blocks end with its beat record:

```markdown
### Fighter A feints the right knee {#s03-b04}

<action and dialogue blocks>

- Cast: [Fighter A](../settings/cast/fighter-a.md#knee-feint), [Fighter B](../settings/cast/fighter-b.md#hab-drops-left-arm)
- Intent: A feints a right knee to draw B's left guard; B reads it as a real knee.
- Outcome: B's guard drops, as [the guard table](../../research/kickboxing/guard.md#outcomes) allows for a read feint.
- Consequence: A lands balanced on the lead foot; B's left arm sits below the shoulder; no mark.
- Camera: medium two-shot, eye level, slow push in.
- Sound: dialogue none; foley glove leather and foot pivots; ambience crowd murmur; effects none; music BI pulse continues.
- Continuity: B's left eyebrow cut from s02-b07 still bleeds.
```

Music names its usage: `BI` background instrumental, `BV` background vocal, `VI` visual instrumental and `VV` visual vocal, a source the picture shows. A layer with nothing in it says `none`, because silence is a decision. Breakdown and beat records are notation, like scene headings: the expression pass rewrites the blocks around them and keeps their decisions.
