# Requests

A request is one planned generation: an interval of the motion hint with its inputs, settings and prompt. Each take is the kept result of one job of it. Plan each scene's requests from its screenplay scene file and the rendered hint.

## Intervals

End a request at a screenplay cut, unless the model takes several shots in one request. A model that cuts a request into shots by default needs that turned off for a continuous shot, and its cut timing is not frame-exact unless it takes its cuts from the hint.

Inside a continuous shot, split only where the model's length forces it, at a beat boundary or a held pose. Every split joins two generations where identity and light can jump, and a split inside a contact or a spoken line shows the seam. Time each beat by the frames where the rendered hint performs it, because a beat record's start is provisional.

A take eases toward stillness and drifts in its last seconds. Keep a request shorter than the model's maximum where the shot allows, and render and generate it a little past each cut as an editor's handle, cutting inside it; [project context](../production/project-context.md) records the handle's length. Keep each request's lines speakable within its length, as [generated sound](../audio/SKILL.md#generated-sound) sets.

## Adherence

Adherence is how much of the hint a request keeps. This scale is a starting point, to be checked against the chosen model's takes:

| Keeps from the hint | Suits |
| --- | --- |
| Positions, contacts, timing and camera | Fights, stunts and other contact, and a pose the next shot continues |
| The choreography and camera, while the model adds the movement of cloth and hair | Speech and reaction |
| Blocking, rhythm and camera | Crowds, background action and establishing shots |
| The camera and the coarse plan | A shot whose action the prompt carries |

Where the model sets adherence, record a default level for the film in [project context](../production/project-context.md) and give a request another level where the scale suits it better.

Keeping positions and contacts copies the hint's timing, stiffness included. Repair stiff timing in the performance under [motion](../motion/SKILL.md) and render the hint again, because loosening the model loosens the contacts with it.

At every level the prompt and the references give the faces and surfaces, so turn off any setting that keeps the hint's faceless heads. [Dense channels](../motion/control-channels.md#dense-channels) sets how closely a shape is held.

When the chosen model cannot carry a scene's beats, such as a contact between still frames, tell the user, who may choose another model.

## Inputs

Give each input one role, and state it in the prompt as [input roles](diffusion/prompts.md#input-roles) sets:

- the hint video or its channels, for motion and camera;
- the canon references, for identity and appearance;
- a [shot frame](../image/SKILL.md#shot-frames), for appearance at the hint's pose;
- the accepted previous take, for continuing its motion under [continuity](diffusion/continuity.md#chaining-requests).

[Hints](diffusion/hints.md) sets how each input reaches the model. Render each request's hint and control channels under [control channels](../motion/control-channels.md) at the model's frame rate, frame grid and size.

## Record

Add to each request's [record](../production/media-records.md#records) its scene file, the hint interval with the beat addresses it covers, its adherence and each input with its role.