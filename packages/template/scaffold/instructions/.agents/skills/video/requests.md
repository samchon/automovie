# Requests

A request is one planned generation: an interval of the motion hint with its inputs, settings and prompt. A take is the kept result of one of its jobs. Plan each scene's requests from its screenplay scene file and the rendered hint.

## Intervals

<!-- @reference The [OpenTimelineIO time range guide](https://opentimelineio.readthedocs.io/en/latest/tutorials/time-ranges.html) distinguishes trimmed media from the frames a transition needs. -->

End requests at screenplay cuts unless the model handles several shots. Disable automatic cuts for a continuous shot. Use hint-based cuts where frame accuracy matters.

Split a long shot at a beat boundary or held pose only when the model's length requires it. Avoid splits during contact or dialogue. Time beats from the rendered hint frames.

Keep requests below maximum length where possible to reduce end drift. Add and record handles at least as long as planned transitions under [project context](../production/project-context.md). Fit commissioned speech to the request under [generated sound](../audio/generated-sound.md).

## Adherence

Adherence is how much of the hint a request keeps. This scale is a starting point to check against the chosen model's takes:

| Keeps from the hint | Suits |
| --- | --- |
| Positions, contacts, timing and camera | Fights, stunts and other contact, and a pose the next shot continues |
| Choreography and camera, while the model adds cloth and hair | Speech and reaction |
| Blocking, rhythm and camera | Crowds, background action and establishing shots |
| Camera and the coarse plan | A shot whose action the prompt carries |

Where the model sets adherence, record the film's default level in [project context](../production/project-context.md) and give a request another level where the scale suits it better. [Dense channels](../motion/control-channels.md#dense-channels) sets how closely a shape is held.

Fix stiffness in [motion](../motion/SKILL.md) and rerender. Keep the adherence needed to preserve positions and contacts.

At every level the prompt and references give faces and surfaces, so turn off any setting that keeps the hint's faceless heads.

Report any beat the selected model cannot carry. The user may choose another model.

## Inputs

Give each input one role, and state it in the prompt under [input roles](diffusion/prompts.md#input-roles):

- the hint video or its channels, for motion and camera;
- the canon references, for identity and appearance;
- a [shot frame](../image/diffusion/conditioning.md#shot-frames), for appearance at the hint's pose;
- the accepted previous take, for continuing its motion under [continuity](diffusion/continuity.md#chaining-requests);
- accepted dialogue audio or a voice reference, for commissioned speech where the model takes one.

[Hints](diffusion/hints.md) sets how each input reaches the model. Render the request's hint and channels under [control channels](../motion/control-channels.md) at the model's frame rate and size. Never resample a channel afterwards, because resampling blends depth values and mask colors.

The render draws at the film's `fps`, `width` and `height`. For the delivered render, they keep the delivery profile's values.

For a channel render, use the README render command with or without `--passes`. Set the film's `fps`, `width` and `height` to the model's rate and size for that render only. Keep `durationSeconds` a whole number of frames at that rate.

## Record

Add to each request's [record](../production/media-records.md#records) its scene file, the hint interval with the beat addresses it covers, its adherence and each input with its role. Take the interval's output frames from a [trusted render report](../production/media-records.md#render-reports)'s `cut`. When the request is conditioned on guide passes, name `videos/controls/record.json` in its `IAutoMovieGeneratedAcquisition.inputs` and record the passes and the frame range it used.
