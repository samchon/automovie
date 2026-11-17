# Requests

A request is one planned generation: an interval of the motion hint with its inputs, settings and prompt. A take is the kept result of one of its jobs. Plan each scene's requests from its screenplay scene file and the rendered hint.

## Intervals

End a request at a screenplay cut, unless the model generates several shots in one request. Such a model may cut a request into shots by default, so turn that off for a continuous shot, by the setting or the wording its guide gives; its cuts are not frame-exact unless it takes them from the hint.

Split a continuous shot only where the model's length forces it, at a beat boundary or a held pose, because identity and light can jump at every split, and a split inside a contact or a spoken line shows. Time each beat by the frames where the rendered hint performs it, because a beat record's start is provisional.

A take eases toward stillness and drifts in its last seconds, so keep a request shorter than the model's maximum where the shot allows. Render and generate each request a little past its cuts as an editor's handle, at least as long as any transition the screenplay decides there, and record the handle's length in [project context](../production/project-context.md). Keep the request's lines speakable within its length, as [generated sound](../audio/generated-sound.md) sets.

## Adherence

Adherence is how much of the hint a request keeps. This scale is a starting point to check against the chosen model's takes:

| Keeps from the hint | Suits |
| --- | --- |
| Positions, contacts, timing and camera | Fights, stunts and other contact, and a pose the next shot continues |
| Choreography and camera, while the model adds cloth and hair | Speech and reaction |
| Blocking, rhythm and camera | Crowds, background action and establishing shots |
| Camera and the coarse plan | A shot whose action the prompt carries |

Where the model sets adherence, record the film's default level in [project context](../production/project-context.md) and give a request another level where the scale suits it better. [Dense channels](../motion/control-channels.md#dense-channels) sets how closely a shape is held.

Keeping positions and contacts keeps the hint's timing, stiffness included. Repair stiff timing in the performance under [motion](../motion/SKILL.md) and render the hint again, because loosening adherence loosens the contacts with it.

At every level the prompt and references give faces and surfaces, so turn off any setting that keeps the hint's faceless heads.

When the chosen model cannot carry a scene's beats, such as a contact between still frames, tell the user, who may choose another model.

## Inputs

Give each input one role, and state it in the prompt under [input roles](diffusion/prompts.md#input-roles):

- the hint video or its channels, for motion and camera;
- the canon references, for identity and appearance;
- a [shot frame](../image/diffusion/conditioning.md#shot-frames), for appearance at the hint's pose;
- the accepted previous take, for continuing its motion under [continuity](diffusion/continuity.md#chaining-requests);
- accepted dialogue audio or a voice reference, for speech, where the model takes one.

[Hints](diffusion/hints.md) sets how each input reaches the model. Render the request's hint and channels under [control channels](../motion/control-channels.md) at the model's frame rate, frame grid and size.

## Record

Add to each request's [record](../production/media-records.md#records) its scene file, the hint interval with the beat addresses it covers, its adherence and each input with its role.
