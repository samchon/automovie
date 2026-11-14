# Requests

A request is one generation job: an interval of the motion hint with its inputs, settings and prompt. Plan each scene's requests from its screenplay scene file and the rendered hint, once the [video skill](SKILL.md) has chosen the model and read its documentation.

## Cuts

A scene file is one continuous place and time, so a request never spans two. Within a scene, cut where the model's length limit requires, at a beat boundary, a camera change or a held pose, because a cut inside a contact, a combination or a spoken line shows the seam in the action. Keep each request's lines speakable within its length, as [generated sound](../audio/SKILL.md#generated-sound) sets.

Place each beat at the frames where the rendered hint performs it, not at the start its beat record gives, which is provisional and which the code replaced with timing from its laws.

Render each request's hint and control channels at the model's frame rate, frame grid and size under [control channels](../motion/control-channels.md), with a few handle frames past each cut so takes can be trimmed and joined.

## Adherence

How closely a request follows the hint is one of four modes:

| Mode | Keeps from the hint | Suits |
| --- | --- | --- |
| Exact | Positions, contacts, timing and camera | Fights, stunts and other contact, and a pose the next shot continues |
| Natural | The choreography and camera, while the model adds faces, breathing and secondary motion | Speech and reaction |
| Loose | Blocking, rhythm and camera | Crowds, background action and establishing shots |
| Reinterpreted | The camera and the coarse plan | A shot whose action the prompt carries |

Start from the default mode [project context](../production/project-context.md) records, and depart from it only where a beat needs another. Whatever the mode, the request locks what its beats decided and the next shot relies on: each outcome, each contact, and the pose and screen direction the next shot continues.

A model loosened as a whole drops overlapping and fast movement first, which is where contacts happen, so loosen only a stretch where nothing is locked. When one interval needs two modes, split it into sub-shots at the boundary for a hosted model, whose settings apply to the whole request; give an open model a [mask](../motion/control-channels.md) that holds the locked region or frames and loosens the rest.

A mode reaches the model in the way it takes the hint, and [diffusion models](diffusion.md) gives each model's controls:

| Model kind | Sets the mode through |
| --- | --- |
| Hosted, edits or restyles a video | Its adherence settings, or edit wording that names what changes and keeps the rest |
| Hosted, reads a reference video | Wording that says what the reference supplies, such as only its timing and camera |
| Hosted, takes still frames | Nothing: it keeps only those frames, so it serves only a reinterpreted shot |
| Open weights with control channels | Each channel's strength and the step where its control ends, per region and frame through masks |

The exact mode copies the hint's timing, stiffness included. Repair stiff timing in the performance under [motion](../motion/SKILL.md) and render the hint again, because loosening the model loosens the contacts with it.

## Inputs

Give each input one role and state it in the prompt: the hint video or its channels for motion and camera, the canon references for identity and look, and, where a model works in segments, the previous accepted take's last frames for motion across the seam. Give every segment the canon references too, because identity and color drift with every segment chained from generated frames.

A dense channel, such as the hint video or depth, carries a form's shape as well as its place, so at full strength a coarse form comes back as boxes and a person keeps the polygon man's smooth surface. Give an open model pose for people and edges or depth at a lower strength for other forms, and keep the dense channels for what must keep its exact shape.

## Record

Add to each request's [record](../production/media-records.md#records) its scene file, the hint interval with the beat addresses it covers, its mode with what it locks, and each input with its role.
