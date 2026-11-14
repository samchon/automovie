# Requests

A request is one planned generation: an interval of the motion hint with its inputs, settings and prompt, and each take is the kept result of one job of it. Plan each scene's requests from its screenplay scene file and the rendered hint, once the [video skill](SKILL.md) has chosen the model and read its documentation.

## Intervals

End a request at a screenplay cut unless the model takes several shots in one request, and inside a continuous shot only where the model's length, or a beat the model cannot carry inside one request, such as a contact a still-frame model must hold on a frame or a second camera move, forces it, because every boundary there joins two generations, where identity and light can jump. Place each boundary inside a continuous shot at a beat boundary or a held pose, because a boundary inside a contact, a combination or a spoken line shows the seam in the action.

On a model with fixed lengths, place boundaries so each interval matches a fixed length where the beats allow; otherwise generate at the next longer length and trim the take's end under [place takes in time](generation.md#place-takes-in-time). Never trim past a take's conditioned last frame or its generated speech; when the excess cannot be trimmed without cutting past either, retime the take if it has no generated sound, and otherwise tell the user.

Keep each request's lines speakable within its length, as [generated sound](../audio/SKILL.md#generated-sound) sets.

A subject the model first meets after a request's opening frame drifts from its references; where the model takes no [keyframe](../image/SKILL.md#shot-frames) for it, describe it in the prompt with its shared-description words.

Time each beat in the request's interval and prompt by the frames where the rendered hint performs it, because a beat record's start is provisional and the code replaces it with timing from its laws.

Render each request's hint and control channels under [control channels](../motion/control-channels.md) at the model's frame rate, frame grid and size, because a model snaps other lengths to its grid and drops or shortens frames. Where the model generates from the hint video or its channels, add a few handle frames past each boundary, rendered through the request's own camera and counted within the model's length and grid, so takes can be trimmed and joined. With handles, condition the closing boundary's frame, not the trailing handle's end.

## Adherence

Adherence is how much of the hint a request keeps. Describe each request by what it keeps; this scale is a starting point, to be checked against the chosen model's takes:

| Keeps from the hint | Suits |
| --- | --- |
| Positions, contacts, timing and camera | Fights, stunts and other contact, and a pose the next shot continues |
| The choreography and camera, while the model adds the movement of cloth and hair | Speech and reaction |
| Blocking, rhythm and camera | Crowds, background action and establishing shots |
| The camera and the coarse plan | A shot whose action the prompt carries |

At every level the prompt and the references give the faces and surfaces, because the hint carries neither, so release any setting that holds the hint's faces.

The scale is about motion; keep the hint's shapes only as closely as the forms are true, as [dense passes](../motion/control-channels.md#dense-passes) explains. Where the model sets shape apart from motion, such as by a structure setting or a depth blur, set shape there.

Where the model sets adherence, choose a default level for the film from the scale and record it in [project context](../production/project-context.md), then give a request another level where the scale suits its content better.

A proprietary model's settings apply to the whole request. An open model's control adapter may vary its control over frames and regions through a [control mask](../motion/control-channels.md) that scales it; a mask that keeps source pixels keeps the gray forms, so read which kind the adapter takes.

Adherence reaches the model in the way it takes the hint, and [diffusion models](diffusion.md) gives each model's controls:

| Model kind | Sets adherence through |
| --- | --- |
| Proprietary, edits or restyles a video | Its adherence settings, keyframes at chosen frames, or edit wording that names what changes and keeps the rest |
| Reads a reference video | Wording that says what the reference supplies, such as only its timing and camera |
| Turns a gray layout into the shot, hosted or through an open adapter | Its documented strength, if any, and the wording its guide sets |
| Proprietary, moves one figure onto a character | Nothing documented |
| Proprietary, takes still frames | Nothing: it keeps only those frames, so a contact or outcome must land at a held pose on one of them |
| Open weights with control adapters | Each adapter's strength and the steps where it acts |

Give a model that moves one figure onto a character only shots it can carry, as its documentation sets, with a [shot frame](../image/SKILL.md#shot-frames) as its character image. When the chosen model cannot carry a scene's beats, such as a contact between still frames or a second moving figure, tell the user, who may choose another model, and follow their choice.

Keeping positions and contacts copies the hint's timing, stiffness included. Repair stiff timing in the performance under [motion](../motion/SKILL.md) and render the hint again, because loosening the model loosens the contacts with it.

## Inputs

Give each input one role:

- the hint video or its channels, for motion and camera;
- the canon references, for identity and appearance;
- a first frame made under [shot frames](../image/SKILL.md#shot-frames), where no previous take continues into the request;
- any last frame or keyframe that shot frames calls for, to keep the hint's pose there;
- where consecutive requests continue one motion, the accepted previous take's frames where the request's hint begins, for motion across the boundary.

Those frames lie inside the previous take, not in its trailing handle. State each role in the prompt as [input roles](prompts.md#input-roles) sets. Give every request that continues a previous take the canon references too, within the inputs the model combines, because identity and color drift with every request chained from generated frames.

Give an open model the passes [dense passes](../motion/control-channels.md#dense-passes) sets.

## Record

Add to each request's [record](../production/media-records.md#records) its scene file, the hint interval with the beat addresses it covers, its adherence where the model sets one, and each input with its role.
