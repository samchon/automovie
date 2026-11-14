# Project context

The production's `PROJECT.md` holds the current overview, commissioned scope, adopted choices and constraints. Read it when starting or resuming work, and update it whenever a consequential choice is adopted or changed, before later work relies on it. Keep one concise current account for the user and the next agent; Git keeps superseded choices.

## What to record

Record only what this project needs; an instance-only request needs no story, and a screenplay-only request no renderer. Leave an undecided choice or an unanswered question explicit and continue only the work that does not depend on it, because a guessed answer is not a delegation.

| Topic | Record when relevant |
| --- | --- |
| Overview | What is made, in a sentence or two, with its audience and intended experience, or on long work a link to the settings record that owns them |
| Commissioned scope | The [commissioned output](SKILL.md#commissioned-outputs) and its boundary, with any authorized slice, deferred work and exclusions |
| Representation | That people are polygon men and other subjects coarse forms, and which delivery, if any, selects which [detail option](../development/entities.md#detail) |
| Delivery profile | For each delivered video: dimensions, frame rate, running time, container and codec, color and caption tracks, and, only for a [commissioned soundtrack](../audio/SKILL.md#commissioned-soundtrack), audio tracks, the loudness target and any stems or music-and-effects mix it requires |
| Look | For a commissioned generated film, the film's look as the user fixed or delegated it, in the look facets the settings layer's [cinematography](../story/layers/settings.md#records) domain lists; on long work with settings, the cinematography record takes over that answer, and the row then links to it |
| Adopted approach | The story route, required control channels, how the video model takes the hint and its default [adherence](../video/requests.md#adherence), engine feedback and sound, with the reasons and limits that affect later choices |
| Tools and operating constraints | Chosen providers or local tools, the video, image and 3D generation models, the takes per video request, runtime, hardware, time, cost and rights limits, and approved setup |
| Authority and unresolved choices | What the user fixed, what the agent decided within delegation and why, and what remains open |

## How it controls the work

The recorded scope selects the skills and the acceptance boundary. An adopted user decision is fixed within its scope; routine delegated decisions are made and recorded without another permission round, and a proposal or inference is not an adopted choice. When the user changes direction, update this file and the affected owners together, keeping closed narrative work under [upstream repair](../story/correction/repair.md).

The delivery profile has this one owner. Each film module realizes it, and on long work the settings scope record states running time and frame as the story conditions they are and must agree with it. When they disagree, correct the profile from the user's commission first and the others from the profile, because each check otherwise passes against its own copy.

Keep every other fact, apart from a look no settings record holds, with its owner and link to it: creative instructions in `docs/instructions`, canon and text in their layers, findings and reviews in their records, and setup and secrets under [source layout](../development/source-layout.md). A recorded preference proves no execution or approval.

## Asking for operating choices

Ask for an operating choice the user neither made nor delegated, such as the video model, a cost limit or the container and codec, when the first task that uses it begins, and record the answer here. Asked earlier, the user answers before knowing what the choice changes. When the agent writes the story, running time, frame and the rest of the story are asked under [creative requirements](../story/planning/requirements.md#asking-the-user), and a generated film's look is asked as that page sets, whoever writes the screenplay.
