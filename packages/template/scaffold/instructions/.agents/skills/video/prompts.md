# Video prompts

A video prompt tells a model what the motion hint cannot show: who each figure is, how they look and act, what the place and light look like, and what the shot sounds like. The hint, its control channels and the references already fix positions, timing and camera, so prose that restates or contradicts them competes with the stronger input.

Follow the selected model's own prompting guide, linked in [diffusion models](diffusion.md); the rules here are what those guides share.

## Sources

A prompt is put together from what the story already decided, so no request invents a look or a performance. A decision the prompt needs and no record holds is made at its owner under [repair](../story/correction/repair.md), never in the prompt: a missing reaction returns the screenplay to its author, and a missing detail of a look becomes a concretization.

### Shared description

Write each person, place and recurring prop once, from its settings or brief record and its canon images, and the look once, from the settings' cinematography or the brief's look. Reuse the identical words in every request that shows them, because a reworded description is a different character to the model.

### Request paragraph

Write what happens in the request's interval from the [beat records](../story/layers/notation.md#records) and dialogue of its beats:

| From the beats | The paragraph says |
| --- | --- |
| Cast | Which polygon man becomes which person, by the reference token or element name when the model binds references, and by screen position |
| Reaction | Each facial expression and reaction the hint cannot show, at its time within the request |
| Dialogue | Each line, written as [sound](#sound) sets |
| Camera | The lens, depth of field and focus, which the hint's geometry does not carry |

Leave out what the hint performs: positions, actions, contacts, timing and camera moves.

## Content

### Plain prose

Describe the finished shot in plain prose, in this order: camera and framing, each figure, its action where the hint does not carry it, the setting, light and palette, style, then sound. Natural sentences steer better than keyword lists, and pasted tag-style prompts from another model lose meaning.

### What to show

Describe what to show, not what to avoid, because a negated word still primes its concept. Use a negative field only as the model's guide describes it.

### Settings stay out of prose

Keep duration, size, frame rate and seed in the request's settings. Prose such as "make it longer" changes nothing.

## Input roles

The hint's figures are gray and coarse, so motion and appearance arrive through different inputs, as [requests](requests.md#inputs) assigns them.

### Structural control

With a pose, depth, edge or layout control, describe appearance, material, light and style only. The control carries the motion, and words about motion or structure fight it.

### Hint video

State the video's role in one sentence, in the model's wording for an edit or a reference, with what the request's [adherence](requests.md#adherence) keeps ("the input video supplies only camera, positions and timing"), and map each polygon man to its reference. Name the gray forms only as what each one becomes, never as the look to produce: one guide asks to say what the render's forms stand for and another to keep words such as clay or 3D out, so follow the selected model's.

### First frame or keyframe

When the model accepts one, give appearance there: an image made from the hint's own first frame under [image](../image/SKILL.md), so the generated shot starts in the hint's pose and camera.

### Still frames only

A model that takes only still frames receives no motion from the hint, so the prose carries it. Give each shot one camera move and one subject action, written as countable beats ("takes three steps and stops at the rail"), because several in one request blur, morph or drop; split the shot instead, or use the model's own timestamp or multi-shot syntax when it has one.

## Sound

Write the shot's sound, decided under [audio](../audio/SKILL.md), in the model's syntax: usually each line in quotes after a named speaker whose name matches the visual description, then separate effect and ambience lines. When the model makes no sound, leave sound out of the prompt; audio owns that case.

## Check before submitting

Compare the prompt with the hint's start, middle and end frames: every visible figure is named once, no sentence contradicts the hint's positions, order or camera, and the prompt stays within the model's length limit. Regenerate with a stronger control or a shorter shot rather than a longer prompt when motion or camera drifts.
