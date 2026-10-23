# Storytelling

A short can go directly from the user's request to a final video screenplay and implementation. A longer film or series may need shared facts, an event outline, and a plan for its parts. Keep only the layers that help this production make decisions; asset-only work needs none of them.

## Choose The Working Documents

These paths are conventions to adopt or change, not a required directory tree. Use the production's existing names and ownership, create files when they have content, and keep their references current when reorganizing them.

| Decision | Possible home | When to separate it |
| --- | --- | --- |
| Audience, intended effect, format, scope, and fixed constraints | The screenplay header or `docs/brief.md` | Several parts need the same brief |
| World facts, character baselines, places, and rules | `docs/world/` | Multiple scenes depend on facts that need one owner |
| Events, causes, consequences, and the order of revelations | `docs/story/` | The event chain needs review independently of scene execution |
| Observable action, dialogue, and sound in scene order | `docs/script.md` or `docs/scripts/` | Split by sequence, episode, or another useful viewing unit |
| Shot coverage, timing, and transitions | The screenplay or `docs/edit/` | The edit has decisions too detailed for the screenplay |
| Reusable assets, performed shots, and the assembled film | Existing source layout, such as `src/assets/`, `src/shots/`, and `src/film/` | Source ownership belongs to the [production guide](production.md) |

The user's request may already be a sufficient brief. Do not invent worldbuilding, treatments, separate approval stages, or a prose adaptation to fill this table. An explainer, music video, demonstration, or abstract sequence can organize around its communication or visual progression without inventing fictional conflict.

## Write For Picture And Sound

Give each screenplay unit a stable identity and a readable heading so implementation and review can refer to it. State its location and time when those affect execution, then write what the audience can see and hear: actions and reactions, actual spoken lines, meaningful sounds, and any necessary on-screen text. An internal thought needs a chosen means of expression if the audience must receive it.

Keep what happens distinct from how the audience learns it. A fact can be true before a character knows it, and a film can reveal an earlier event later. Preserve that distinction through dialogue, framing, sound, and scene order. Identify deliberate ambiguity where a later author could otherwise resolve it accidentally.

Use estimates while writing, then assess timing with performed action, recorded or generated speech, pauses, transitions, and music. A word count or a nominal scene duration does not establish the film's running time. The [audio guide](audio.md) covers obtaining and checking speech; timing changes return to the affected screenplay, shots, and edit.

Camera and animation details belong here only when they carry a story decision, such as withholding an object until its reveal. The shot implementation can choose routine coverage. Judge pacing from the resulting sequence: a readable action, a listener's reaction, a subtitle, and a scene transition each need time in the actual edit.

## Scale To A Film Or Series

Before expanding many scenes, settle the work's intended destination and the dependencies shared by its parts. Keep enough of the overall event chain to know what a selected episode sets up, changes, and leaves open. Detail the requested part without pretending that unwritten or unrendered parts have been verified.

World documents own baseline facts and constraints. Event outlines own the events that change those facts, the causes and consequences, and their reveal order. Screenplays realize those decisions through scenes. A relationship established before the film belongs with the baseline; its change during the film belongs with the event that causes it. Link to the owner instead of copying an entire biography or setting into each layer.

Choose episode, sequence, and scene boundaries for the material's viewing rhythm and the requested format. One event can span several scenes, several events can share a scene, and a scene can require several shots. Preserve those many-to-many relationships when splitting or merging units; document references can be enough without creating a new schema.

Track the state that later scenes depend on at the boundaries where it changes. Depending on the work, this can include character knowledge, relationships, injuries, wardrobe, carried objects, location, elapsed time, or recurring sound. A compact continuity table is useful when those dependencies become hard to follow; it need not inventory every prop or frame.

For episodic work, distinguish promises meant to resolve within an episode from those spanning the work. For a pilot or partial commission, state the delivered scope and the dependencies left for later parts. A partial delivery is judged within that scope, while its compatibility with established work-wide decisions still matters.

## Keep The Handoff Traceable

Connect each screenplay unit to the shots or other executable source that realizes it, and connect those shots to their place in the edit. Keep the identifiers useful through renames and restructuring. The [contracts skill](../../.agents/skills/contracts/SKILL.md) owns whether and how these relationships enter automated evidence; references alone do not prove that the audience receives the intended action or information.

When a decision changes, identify its owner and all affected consumers before editing. Repair the owner, then update the dependent narrative documents, assets, performances, speech, shots, and edit together. Review coverage as well as content: removed units need their consumers resolved, and added units need implementation. A replacement voice take can change shot lengths, reactions, subtitles, and later edit timing even when the dialogue words stay the same.

## Review The Work The Audience Receives

Use the [narrative checklist](../../.agents/skills/contracts/narrative.md) for the current scope. Read the complete screenplay in viewing order, then watch and listen to the complete delivered sequence. For long works, include the transitions between parts and compare the beginning, later consequences, and ending rather than checking only neighboring scenes.

Assess the work as a viewer who has not read its planning documents. Check whether intended causes, information, emotion, and continuity survive in the actual picture and sound, including dialogue intelligibility and any required text. Inspect the planning and implementation afterward to explain a problem; the existence of a correct document or a linked shot is not the audience's experience.

Finish the inspection round before editing. Gather every finding and affected occurrence by cause, repair the owners and their dependents together, then repeat the full affected review round. State which screenplay, source, and rendered scope were examined, and leave unrendered or unfinished coverage explicit. Production validation and delivery remain with the [production guide](production.md).
