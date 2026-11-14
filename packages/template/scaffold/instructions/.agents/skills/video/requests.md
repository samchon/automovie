# Requests

A request is one generation job: an interval of the motion hint with its inputs, settings and prompt. Plan each scene's requests from its screenplay scene file and the rendered hint, once the [video skill](SKILL.md) has chosen the model and read its documentation.

## Boundaries

End a request where the model's length limit, a screenplay cut or a rule below requires it, and place the boundary at a beat boundary or a held pose, because a boundary inside a contact, a combination or a spoken line shows the seam in the action. A request spans a cut only when the model takes several shots in one request. Keep each request's lines speakable within its length, as [generated sound](../audio/SKILL.md#generated-sound) sets.

Begin each request where every key subject it shows is already in frame, because a subject the model first meets after the opening frame drifts from its references; when one must enter later, give it a [keyframe](../image/SKILL.md#shot-frames) where the model takes one.

Every boundary inside one continuous shot is a join of two generations, where identity and light can jump, so keep a continuous shot in one request at the stricter adherence unless its length forces a boundary.

Place each beat at the frames where the rendered hint performs it, not at the start its beat record gives, which is provisional and which the code replaced with timing from its laws.

Render each request's hint and control channels under [control channels](../motion/control-channels.md) at the model's frame rate, frame grid and size, because a model snaps other lengths to its grid and drops or shortens frames. Add a few handle frames past each boundary, counted within the model's length and grid, so takes can be trimmed and joined.

## Adherence

Adherence is how much of the hint a request keeps. Describe each request by what it keeps, starting from this scale:

| Keeps from the hint | Suits |
| --- | --- |
| Positions, contacts, timing and camera | Fights, stunts and other contact, and a pose the next shot continues |
| The choreography and camera, while the model adds breathing and the movement of cloth and hair | Speech and reaction |
| Blocking, rhythm and camera | Crowds, background action and establishing shots |
| The camera and the coarse plan | A shot whose action the prompt carries |

At every level the prompt and the references give the faces, surfaces and light, because the hint carries none of them, so release any setting that holds the hint's faces.

The scale is about motion; keep the hint's shapes only as closely as the forms are true, because a coarse form held to its shape returns as boxes. A model that sets shape apart from motion, such as by a structure setting or a depth blur, sets it there.

Start from the default adherence [project context](../production/project-context.md) records, and depart from it only where a beat needs another. Whatever the level, the request locks the frames and figures where its beats' outcomes land, contacts happen, and the pose and screen direction the next shot continues are held.

Models keep overlapping and fast movement least well, which is where contacts happen, and a loosened model keeps little more than the largest movement, so loosen only frames and regions that hold none of these. A hosted model's settings apply to the whole request, which therefore takes the strictest level its frames need; an open model takes a [mask](../motion/control-channels.md) that holds the locked region and frames and loosens the rest.

Adherence reaches the model in the way it takes the hint, and [diffusion models](diffusion.md) gives each model's controls:

| Model kind | Sets adherence through |
| --- | --- |
| Hosted, edits or restyles a video | Its adherence settings, keyframe images at chosen frames, or edit wording that names what changes and keeps the rest |
| Hosted, reads a reference video | Wording that says what the reference supplies, such as only its timing and camera |
| Hosted, turns a gray render into the shot | Wording that says what each form stands for |
| Hosted, takes still frames | Nothing: it keeps only those frames, so give it no beat whose outcome or contact falls between them, and tell the user when a scene needs one, who may choose a model that takes the hint video |
| Open weights with control channels | Each channel's strength and the steps where its control acts, per region and frame through masks |

Keeping positions and contacts copies the hint's timing, stiffness included. Repair stiff timing in the performance under [motion](../motion/SKILL.md) and render the hint again, because loosening the model loosens the contacts with it.

## Inputs

Give each input one role and state it in the prompt: the hint video or its channels for motion and camera, the canon references for identity and appearance, and, where consecutive requests continue one motion, the accepted previous take's frames at the shared boundary, not its handles, for motion across it. Give every such request the canon references too, within the model's reference limit, because identity and color drift with every request chained from generated frames; when the limit holds fewer subjects than the request shows, its first frame carries the rest.

Give an adapter trained on gray layouts the hint video as its documentation sets. Give an open model's general controls pose for people and edge or a weakened depth for other forms, because a dense pass at full strength imprints the coarse shape, as [control channels](../motion/control-channels.md#dense-passes) explains; keep dense passes for what must keep its exact shape.

## Record

Add to each request's [record](../production/media-records.md#records) its scene file, the hint interval with the beat addresses it covers, its adherence with what it locks, and each input with its role.
