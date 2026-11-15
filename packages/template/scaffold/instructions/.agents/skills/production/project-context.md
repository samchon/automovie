# Project context

The production's `PROJECT.md` is its one current account of what is made and how: the overview, the commissioned scope, the adopted choices and constraints, and what remains open. It is written for the user and the next agent, so it stays concise and states only the current choices; Git keeps the superseded ones.

## What to record

Record only the topics this project needs; an instance-only request needs no story, and a screenplay-only request no renderer.

| Topic | Record when relevant |
| --- | --- |
| Overview | What is made, in a sentence or two, with its audience and intended experience, or on long work a link to the settings record that owns them |
| Commissioned scope | The [commissioned output](SKILL.md#commissioned-outputs) and its boundary, with any authorized slice, deferred work and exclusions |
| Representation | That people are polygon men and other subjects coarse forms, and which delivery, if any, selects which [detail option](../development/entities.md#detail) |
| Delivery profile | For each delivered video: dimensions, frame rate, running time, container and codec, color and caption tracks, and, for a film with sound, its audio tracks, the loudness target and any stems or music-and-effects mix the release requires; for generated video, the disclosure its release owes |
| Look | For a commissioned generated film, the film's look, as settings [cinematography](../story/layers/settings.md#records) lists its facets, or on long work a link to the settings record that owns it |
| Adopted approach | The story route, required control channels, how the video model takes the hint and its default [adherence](../video/requests.md#adherence), the handle length at cuts, a generated film's frame-rate conform method and working color space, engine feedback, and how sound is made, with the reasons and limits that affect later choices |
| Tools and operating constraints | Chosen providers or local tools, the video, image, 3D and motion generation models, the takes per video request, runtime, hardware, time, cost and rights limits, and approved setup |
| Authority and unresolved choices | What the user fixed, what the agent decided within delegation and why, and what remains open |

Keep every other fact with its owner and link to it: creative instructions in `docs/instructions`, canon and text in their layers, findings and reviews in their records, and setup and secrets under [source layout](../development/source-layout.md).

Leave an undecided choice or an unanswered question explicit, and continue only the work that does not depend on it, because a guessed answer is not a delegation.

## When to read and update it

Read it when starting or resuming work. Update it whenever a consequential choice is adopted or changed, before later work relies on it, replacing the choice it supersedes. When the user changes direction, update this file and the affected owners together, keeping closed narrative work under [upstream repair](../story/correction/repair.md).

## Asking for operating choices

Ask for an operating choice the user neither made nor delegated, such as the video model, a generated film's look, a cost limit or the container and codec, when the first task that uses it begins, and record the answer here. Asked earlier, the user answers before knowing what the choice changes. When the agent writes the story, running time, frame and the rest of the story are asked under [creative requirements](../story/planning/requirements.md#asking-the-user).

## How it controls the work

The recorded scope selects which skills run and sets the acceptance boundary.

An adopted user decision is fixed within its scope. The agent makes routine delegated decisions and records them without another permission round. A proposal or an inference is not an adopted choice, and a recorded preference proves no execution or approval.

The delivery profile has this one owner. Each film module realizes it, and on long work the settings scope record states running time and frame as the story conditions they are and must agree with it. When they disagree, correct the profile from the user's commission first and the others from the profile, because each check otherwise passes against its own copy.
