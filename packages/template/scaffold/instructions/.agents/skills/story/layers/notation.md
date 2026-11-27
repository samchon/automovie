# Notation

Scripts and screenplay share stable [heading identities](#identities). Screenplay blocks and beat records describe the finished performance.

## Blocks

For the screenplay, unless commissioned otherwise, follow [BBC](https://downloads.bbc.co.uk/writersroom/scripts/screenplay.pdf) or [Final Draft](https://www.finaldraft.com/learn/screenplay-formatting-elements/) screenplay blocks. Use a scene heading such as `INT. LOCATION - DAY`, short present-tense paragraphs of visible or audible action, and an uppercase speaker cue on its own line.

Start a new action paragraph at each change of action, response or attention, and mark off-screen speech, voiceover, overlap, screen text and time shifts wherever they would otherwise be ambiguous.

Write events in the order the viewer discovers them. When attention shifts during an ongoing action, show what continues underneath. Estimate running time from the performed action, overlapping speech, pauses and edit. Name the clock for a fixed cue when screen time, story time or a replay differ.

Where music is stated, name its usage: `BI` background instrumental, `BV` background vocal, `VI` visual instrumental and `VV` visual vocal, where visual means a source the picture shows, and `MT` main title and `ET` end title music.

## Identities

A script episode has an H1 for the episode and H2s for scenes. A screenplay scene has an H1 for the scene, H2s for sections and H3s for beats. Give each lower heading an explicit anchor for code, evidence and review. Shot and timing decisions go in records.

Never reuse or renumber an anchor in any layer, or a scene file's number. Number scene files with room for insertions, such as `010-` and `020-`, and record removals and insertions this way:

- a removed script scene, or screenplay section or beat, keeps its heading over the single line `OMITTED`;
- a removed screenplay scene file keeps only its H1 over `OMITTED`, retiring its section and beat anchors;
- an inserted script scene, or screenplay section or beat, takes a new anchor, such as `{#s03-b04a}`;
- an inserted screenplay scene file takes an unused number between its neighbors.

## Records

<!-- @reference [ScreenSkills](https://www.screenskills.com/job-profiles/browse/film-and-tv-drama/technical/script-supervisor-film-and-tv-drama/) describes how script supervisors track action, eyelines and props across takes. -->

Inside the first section, before its scene heading and action, establish the scene elements, their starting relationships, routes and sightlines. Note expected entrances there and record changes of state as they occur. Preserve the intended reveal order.

End each beat with its record of decisions.

```markdown
### Mara cues the lift {#s03-b04}

<action and dialogue blocks>

- Cast: [Mara](../../brief/cast/mara.md#lead-hand), [Jun](../../brief/cast/jun.md#partnering-level)
- Intent: Mara cues a lift with a press of her hand; Jun reads it a beat late.
- Outcome: the lift lands short, within [the limits](../../../research/dance/lifts.md#limits) the study records for a late read.
- Reaction: Mara braces under Jun's weight; Jun lands off balance; Jun's sleeve tears at the seam.
- Start: about 12 s into the section, provisional.
- Space: the pair drifts from center stage toward the downstage wing.
- Camera: push-in from full to medium on Mara and Jun.
- Sound: the music drops to the strings alone.
```

Start a shot with `Cut to` in its `Camera` entry. Other entries reframe or move the current shot. Start with the standing-state camera. End a scene with a transition block when leaving by something other than a cut or ending the film.
