# Notation

Unless the commission adopts another form, use conventional screenplay blocks: a scene heading such as `INT. LOCATION - DAY`, short present-tense action paragraphs of what can be seen or heard, and a consistent speaker cue before each dialogue block, as the [BBC format](https://downloads.bbc.co.uk/writersroom/scripts/screenplay.pdf) and [Final Draft elements](https://www.finaldraft.com/learn/screenplay-formatting-elements/) show. Break paragraphs at changes of action, response or attention, and mark off-screen speech, voiceover, overlap, screen text and time shifts where they would otherwise be ambiguous.

Read the blocks as a continuous sequence, each entry following the preceding exit; final duration comes from the performed action, speech, pauses and edit.

## Identities

A script file is one episode: its H1 names the episode and each H2 is a [scene](screenplay.md#scenes). A screenplay file is one scene: its H1 names the scene, each H2 is a section of it, such as a phase or a movement, and each H3 a beat. Every heading below the H1 has an explicit anchor such as `{#s03}` and `{#s03-b04}`. Headings are addresses for code, evidence and reviews; they prescribe neither shot boundaries nor duration.

Never reuse or renumber an anchor or a scene file's number, so an existing citation never silently points at different content:

- a removed script scene, or screenplay section or beat, keeps its heading over the single line `OMITTED`;
- a removed screenplay scene file keeps only its H1 over `OMITTED`, retiring its section and beat anchors;
- an inserted script scene, or screenplay section or beat, takes a new anchor, such as `{#s03-b04a}`;
- an inserted screenplay scene file takes an unused number between its neighbors, so number scene files with room, such as `010-` and `020-`.

## Records

A screenplay scene file's first section opens with the scene's standing state as a list, inside the section so its answers and review cover it; each entry links the settings or brief decision that owns it, where one does. Each beat's action and dialogue blocks end with its beat record. Both hold what the [beat-decisions question](../../contracts/story/shared/principles/screenplay.md#beat-decisions) asks:

```markdown
### Mara cues the lift {#s03-b04}

<action and dialogue blocks>

- Cast: [Mara](../../brief/cast/mara.md#lead-hand), [Jun](../../brief/cast/jun.md#partnering-level)
- Intent: Mara cues a lift with a press of her hand; Jun reads it a beat late.
- Outcome: the lift lands short, as [the partnering table](../../../research/dance/lifts.md#outcomes) allows for a late read.
- Reaction: Mara braces under Jun's weight; Jun lands off balance; Jun's sleeve tears at the seam.
- Start: about 12 s into the section, provisional.
- Space: the pair drifts from center stage toward the downstage wing.
- Camera: slow push in from the standing two-shot.
```

Music names its usage where it is stated: `BI` background instrumental, `BV` background vocal, `VI` visual instrumental and `VV` visual vocal, a source the picture shows.
