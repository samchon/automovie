# Project context

The production's `PROJECT.md` is its one current account of what is made and how, written for the user and the next agent. It states only the current choices, concisely; Git keeps the superseded ones.

## What to record

Record only the topics this project needs; a standalone asset needs no story, and a screenplay-only request no renderer.

| Topic | Record |
| --- | --- |
| Overview | What is made, its audience and intended experience, in a sentence or two, or on long work a link to the settings record that owns them |
| Commissioned scope | The [commissioned output](SKILL.md#commissioned-outputs) and its boundary, with any authorized slice, deferred work and exclusions |
| Representation | That people are polygon men and other subjects coarse forms, and which delivery, if any, selects which [detail option](../development/entities.md#detail) |
| Delivery profile | Each delivered video's technical form, listed [below](#the-delivery-profile) |
| Look | For a generated or direct 3D film, its look by the facets settings [cinematography](../story/layers/settings.md#records) lists, or on long work a link to the settings record that owns it |
| Adopted approach | The story route, required control channels, how the video model takes the hint and its default [adherence](../video/requests.md#adherence), the handle length at cuts, engine feedback and how sound is made, with the reasons and limits that affect later choices |
| Finishing approach | A generated film's frame-rate conform and working color space, or a direct 3D film's exposure and tone curve |
| Tools and operating constraints | Chosen providers or local tools, the video, image, 3D and motion generation models, the takes per video request, runtime, hardware, time, cost and rights limits, and approved setup |
| Authority and open choices | What the user fixed, what the agent decided within delegation and why, and what remains open |

Keep every other fact with its owner and link to it: creative instructions in `docs/instructions`, canon and text in their layers, findings and reviews in their records, and setup and secrets under [source layout](../development/source-layout.md).

### The delivery profile

The profile records, for each delivered video:

- dimensions, scan, running time, and frame rate as an exact fraction such as 24000/1001;
- container and codec;
- color primaries, transfer, matrix and range;
- caption tracks, with their format and style guide;
- for a film with sound, its audio tracks and sample rate, the loudness target with its measurement method and true-peak limit, and any stems or music-and-effects mix the release requires;
- for generated video, the disclosure its release owes.

This file is the profile's one owner. Each film module realizes it, and on long work the settings scope record states running time and frame as story conditions that agree with it. When they disagree, correct the profile from the user's commission first and the others from the profile, because each check otherwise passes against its own copy.

## When to read and update it

Read it when starting or resuming work. Update it whenever a consequential choice is adopted or changed, before later work relies on it. When the user changes direction, update this file and the affected owners together, keeping closed narrative work under [repair](../story/correction/repair.md).

Ask for an operating choice the user neither made nor delegated, such as the video model, a film's look, a cost limit or the container and codec, when the first task that uses it begins, and record the answer here, because a user asked earlier answers before knowing what the choice changes. When the agent writes the story, running time, frame and the rest of the story are asked under [creative requirements](../story/planning/requirements.md#asking-the-user).

## How it controls the work

The recorded scope selects which skills run and sets the acceptance boundary. An adopted user decision is fixed within its scope, and the agent makes routine delegated decisions and records them without another permission round.

A proposal or an inference is not an adopted choice, and a recorded preference proves no execution or approval. Leave an undecided choice or an unanswered question explicit and continue only the work that does not depend on it, because a guessed answer is not a delegation.
