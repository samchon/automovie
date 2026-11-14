# Requests

A request is one planned generation: an interval of the motion hint with its inputs, settings and prompt. Each take is the kept result of one job of it. Plan each scene's requests from its screenplay scene file and the rendered hint, after the [video skill](SKILL.md) has chosen the model and read its documentation.

## Intervals

End a request at a screenplay cut, unless the model takes several shots in one request. Inside a continuous shot, split only where the model's limits force it, at a beat boundary or a held pose, because every split joins two generations where identity and light can jump, and a split inside a contact or a spoken line shows the seam.

Keep each request's lines speakable within its length, as [generated sound](../audio/SKILL.md#generated-sound) sets.

Time each beat by the frames where the rendered hint performs it, because a beat record's start is provisional.

Render each request's hint and control channels under [control channels](../motion/control-channels.md) at the model's frame rate, frame grid and size.

## Adherence

Adherence is how much of the hint a request keeps. This scale is a starting point, to be checked against the chosen model's takes:

| Keeps from the hint | Suits |
| --- | --- |
| Positions, contacts, timing and camera | Fights, stunts and other contact, and a pose the next shot continues |
| The choreography and camera, while the model adds the movement of cloth and hair | Speech and reaction |
| Blocking, rhythm and camera | Crowds, background action and establishing shots |
| The camera and the coarse plan | A shot whose action the prompt carries |

At every level the prompt and the references give the faces and surfaces, so release a setting that holds the hint's faces. [Dense passes](../motion/control-channels.md#dense-passes) sets how closely a shape is held.

Where the model sets adherence, record a default level for the film in [project context](../production/project-context.md) and give a request another level where the scale suits it better. Each model's page under [video diffusion](diffusion/SKILL.md#models) shows how it sets it: by its settings, by wording that says what the input supplies, or by each control adapter's strength and mask.

When the chosen model cannot carry a scene's beats, such as a contact between still frames, tell the user, who may choose another model.

Keeping positions and contacts copies the hint's timing, stiffness included. Repair stiff timing in the performance under [motion](../motion/SKILL.md) and render the hint again, because loosening the model loosens the contacts with it.

## Inputs

Give each input one role, and state it in the prompt as [input roles](prompts.md#input-roles) sets:

- the hint video or its channels, for motion and camera;
- the canon references, for identity and appearance;
- a [shot frame](../image/SKILL.md#shot-frames), for appearance at the hint's pose;
- the accepted previous take, where a request continues its motion: its ending as a second video where the model takes several videos with separate roles, and otherwise its last frame as the first frame.

A model's extend mode often takes no hint video, and some models take frames or reference videos but not both. Where the model cannot take the continuation beside the hint, end the request at a cut.

Give a continuing request the canon references too, because identity and color drift across chained requests. Give an open model the passes [dense passes](../motion/control-channels.md#dense-passes) sets.

## Record

Add to each request's [record](../production/media-records.md#records) its scene file, the hint interval with the beat addresses it covers, its adherence and each input with its role.
