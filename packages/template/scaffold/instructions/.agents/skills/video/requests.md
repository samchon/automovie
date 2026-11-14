# Requests

A request is one planned generation: an interval of the motion hint with its inputs, settings and prompt, and each take is one job of it. Plan each scene's requests from its screenplay scene file and the rendered hint, once the [video skill](SKILL.md) has chosen the model and read its documentation.

## Boundaries

End a request where the model's length limit or fixed lengths, a screenplay cut, the end of each beat for a model that takes only still frames, or a rule below requires it, and place the boundary at a beat boundary or a held pose, because a boundary inside a contact, a combination or a spoken line shows the seam in the action. A request spans a cut only when the model takes several shots in one request. Keep each request's lines speakable within its length, as [generated sound](../audio/SKILL.md#generated-sound) sets.

Begin each request where every key subject it shows is already in frame, because a subject the model first meets after the opening frame drifts from its references; when one must enter later, give it a [keyframe](../image/SKILL.md#shot-frames) where the model takes one; otherwise name the entering subject in the prompt.

Every boundary inside one continuous shot is a join of two generations, where identity and light can jump, so keep a continuous shot in one request unless its length or the model forces a boundary.

Time each beat in the request's interval and prompt by the frames where the rendered hint performs it, because a beat record's start is provisional and the code replaced it with timing from its laws.

Render each request's hint and control channels under [control channels](../motion/control-channels.md) at the model's frame rate, frame grid and size, because a model snaps other lengths to its grid and drops or shortens frames. Where the model generates from the hint video, add a few handle frames past each boundary, rendered through the request's own camera and counted within the model's length and grid, so takes can be trimmed and joined.

## Adherence

Adherence is how much of the hint a request keeps. Describe each request by what it keeps; this scale is a starting point, to be checked against the chosen model's takes:

| Keeps from the hint | Suits |
| --- | --- |
| Positions, contacts, timing and camera | Fights, stunts and other contact, and a pose the next shot continues |
| The choreography and camera, while the model adds the movement of cloth and hair | Speech and reaction |
| Blocking, rhythm and camera | Crowds, background action and establishing shots |
| The camera and the coarse plan | A shot whose action the prompt carries |

At every level the prompt and the references give the faces and surfaces, because the hint carries neither, so release any setting that holds the hint's faces.

The scale is about motion; keep the hint's shapes only as closely as the forms are true, because a coarse form held to its shape returns as boxes. Where the model sets shape apart from motion, such as by a structure setting or a depth blur, set shape there.

Start from the default adherence [project context](../production/project-context.md) records, and give a request a stricter level only where it holds a contact, fast or overlapping movement, or a pose and screen direction the next shot continues, because some models lose these first.

A hosted model's settings apply to the whole request. An open model's control adapter may vary its control over frames and regions through a [mask](../motion/control-channels.md) that scales it; a mask that keeps source pixels keeps the gray forms, so read which kind the adapter takes.

Adherence reaches the model in the way it takes the hint, and [diffusion models](diffusion.md) gives each model's controls:

| Model kind | Sets adherence through |
| --- | --- |
| Hosted, edits or restyles a video | Its adherence settings, keyframes at chosen frames, or edit wording that names what changes and keeps the rest |
| Hosted, reads a reference video | Wording that says what the reference supplies, such as only its timing and camera |
| Turns a gray layout into the shot, hosted or through an open adapter | Its documented strength, if any, and the wording its guide sets |
| Hosted, moves one figure onto a character | Nothing documented; it moves only the largest figure, so give it only shots where one figure, or one clearly the largest, moves, and a [shot frame](../image/SKILL.md#shot-frames) as its character image |
| Hosted, takes still frames | Nothing: it keeps only those frames, so a contact or outcome must land at a held pose on one of them |
| Open weights with control adapters | Each adapter's strength and the steps where it acts, and a mask as its documentation defines one |

When the chosen model cannot carry a scene's beats, such as a contact between still frames or a second figure, tell the user, who may choose another model, and follow their choice.

Keeping positions and contacts copies the hint's timing, stiffness included. Repair stiff timing in the performance under [motion](../motion/SKILL.md) and render the hint again, because loosening the model loosens the contacts with it.

## Inputs

Give each input one role: the hint video or its channels for motion and camera, the canon references for identity and appearance, and, where consecutive requests continue one motion, the accepted previous take's frames at the shared boundary, not its handles, for motion across it. State each role in the prompt as [input roles](prompts.md#input-roles) sets. Give every such request the canon references too, within the inputs the model combines, because identity and color drift with every request chained from generated frames.

Give an adapter trained on gray layouts the hint video as its documentation sets, and an open model's control adapters the passes [dense passes](../motion/control-channels.md#dense-passes) sets for each form.

## Record

Add to each request's [record](../production/media-records.md#records) its scene file, the hint interval with the beat addresses it covers, its adherence, and each input with its role.
