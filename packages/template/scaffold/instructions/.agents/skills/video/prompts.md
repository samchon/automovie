# Video prompts

A video prompt tells a model what the motion hint cannot show: who each figure is, how they look and act, what the place and light look like, and what the shot sounds like. The hint, its control channels and the references already fix positions, timing and camera, so prose that restates or contradicts them competes with the stronger input.

Follow the selected model's own prompting guide, linked in [diffusion models](diffusion.md); the rules here are the defaults most of those guides share, and where the selected guide asks otherwise, it wins.

## Sources

A prompt is put together from what the story already decided, so no request invents an appearance or a performance. A decision the prompt needs and no record holds is made at its owner under [repair](../story/correction/repair.md), never in the prompt: a missing reaction returns the screenplay to its author, and a missing detail of a subject's appearance or of the film's look is added under [concretization](../story/correction/repair.md#concretization) to the record that owns it.

### Shared description

Write each person, place and recurring prop once, from the record that owns it, and the film's lighting style, lens character and grade once, from the settings' or the brief's cinematography record. Keep them in one file under `docs/prompts/`, laid out by [media records](../production/media-records.md#files), that every request cites, and reuse the identical words in every request that shows them, because a reworded description is a different character to the model. Turn off any prompt rewriting the model offers, since it rewords them.

### Request paragraph

Write what happens in the request's interval from the [beat records](../story/layers/notation.md#records) of its beats:

| From the beats | The paragraph says |
| --- | --- |
| Cast | Which polygon man becomes which person, by the reference token or element name when the model binds references, and by screen position |
| Reaction | Each facial expression and reaction the hint cannot show, in the order the hint performs the beats, with the model's timestamp syntax where it has one |
| Camera | The lens, depth of field and focus the beat's camera entry decides; the hint carries framing and moves |

Leave out what the hint performs: positions, actions, contacts, timing, framing and camera moves. When the selected guide asks for each shot's action and camera, as some adapters trained on gray layouts do, write them from the same beat records and the hint, in words that match it. A model that takes only still frames needs them too, as [still frames only](#still-frames-only) sets.

## Content

### Plain prose

Write the prompt in plain prose, in this order: any trigger words the adapter's documentation puts first, the inputs' roles, the shared description, the request paragraph, then sound. Natural sentences steer better than keyword lists, and pasted tag-style prompts from another model lose meaning.

### What to show

Describe what to show, not what to avoid, because a negated word still primes its concept. Use a negative field only as the model's guide describes it.

### Settings stay out of prose

Keep duration, size, frame rate and seed in the request's settings. Prose such as "make it longer" changes nothing.

## Input roles

The hint's figures are gray and coarse, so motion and appearance arrive through different inputs, as [requests](requests.md#inputs) assigns them.

### Structural control

With a pose, depth, edge or layout control, write no motion or structure, because the control carries them and such words fight it.

### Hint video

Where the model's guide asks for the video's role, state it in one sentence, in the model's wording for an edit or a reference, with what the request's [adherence](requests.md#adherence) keeps ("the input video supplies only camera, positions and timing"). Name the gray forms only as what each one becomes, never as the appearance to produce: one guide asks to say what the render's forms stand for and another to keep words such as clay or 3D out, so follow the selected model's.

### First frame or keyframe

When the model accepts one, give appearance there: an image made from the hint's own first frame under [image](../image/SKILL.md), so the generated shot starts in the hint's pose and camera. Describe the same appearance in the prompt as the frame shows, because a prompt that disagrees with the frame pulls the shot away from it.

### Still frames only

A model that takes only still frames receives no motion from the hint, so the prose also carries the framing and the action. Give each request one camera move and one subject action, written as countable beats ("takes three steps and stops at the rail"), because a chain of several in one request is followed less reliably; split the request instead, or use the model's own timestamp or multi-shot syntax when it has one.

## Sound

Write the shot's sound, decided under [audio](../audio/SKILL.md), in the model's syntax: each line after a named speaker whose name matches the visual description, marked by quotes, a colon or a dialogue block as the guide sets, then separate effect and ambience lines. When the model makes no sound, leave sound out of the prompt; audio owns that case.

## Check before submitting

Compare the prompt with the hint's start, middle and end frames: every visible figure is named once, no sentence contradicts the hint's positions, order or camera, and the prompt stays within the model's length limit. When motion or camera drifts, regenerate with a stricter adherence or a shorter request rather than a longer prompt, and repair framing under [generation](generation.md#inspect-and-choose).
