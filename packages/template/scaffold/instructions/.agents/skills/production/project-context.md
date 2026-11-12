# Project context

The production's `PROJECT.md` holds the current overview, commissioned scope, adopted choices and constraints. Read it when starting or resuming work, and update it whenever a consequential choice is adopted or changed, before later work relies on it. Keep one concise current account for the user and the next agent; Git keeps superseded choices.

## What to record

Record only what this project needs; an instance-only request needs no story, and a screenplay-only request no renderer. Leave an undecided nonblocking choice explicit and continue the work that does not depend on it.

| Topic | Record when relevant |
| --- | --- |
| Overview | What is made, in a sentence or two, linking the canon record that owns the audience and the intended experience |
| Commissioned scope | The [commissioned output](SKILL.md#commissioned-outputs) and its boundary, with any authorized slice, deferred work and exclusions |
| Representation | That people are polygon men and other subjects coarse forms, and which delivery, if any, selects which [detail option](../development/entities.md#detail) |
| Delivery profile | For each delivered video: dimensions, frame rate, running time, container and codec, color and caption tracks, and, only for a [commissioned soundtrack](../audio/SKILL.md#commissioned-soundtrack), audio tracks, the loudness target and any stems or music-and-effects mix it requires |
| Adopted approach | The story route, required control channels, engine feedback and sound, with the reasons and limits that affect later choices |
| Tools and operating constraints | Chosen providers or local tools, the video model, runtime, hardware, time, cost and rights limits, and approved setup |
| Authority and unresolved choices | What the user fixed, what the agent decided within delegation and why, and what remains open |

## How it controls the work

The recorded scope selects the skills and the acceptance boundary. An adopted user decision is fixed within its scope; routine delegated decisions are made and recorded without another permission round, and a proposal or inference is not an adopted choice. When the user changes direction, update this file and the affected owners together, keeping closed narrative work under [upstream repair](../story/correction/repair.md).

The delivery profile has this one owner. A brief or settings scope record states running time and frame as the story conditions they are and must agree with it, and each film module realizes it. When the three disagree, correct the profile from the user's commission first and the other two from the profile, because each check otherwise passes against its own copy.

Keep every other fact with its owner and link to it: creative instructions in `docs/instructions`, canon and text in their layers, findings and reviews in their records, and setup and secrets under [source layout](../development/source-layout.md). A recorded preference proves no execution or approval.

## Asking operating choices {#asking-operating-choices}

Ask for an operating choice the user neither made nor delegated, such as the video model, a cost limit or the delivery format, when the first task that uses it begins, and record the answer here. Asked earlier, the user answers before knowing what the choice changes. Running time, frame and the rest of the story are asked under [creative requirements](../story/planning/requirements.md#asking-the-user).

A question the user cannot answer during the run, as in an unattended run, is recorded under authority and unresolved choices, and the work that depends on it stops, because a guessed answer is not a delegation.
