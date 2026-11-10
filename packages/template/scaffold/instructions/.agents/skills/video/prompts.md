# Video prompts

A video prompt tells a model what the motion hint cannot show: who each figure is, what the place and light look like, and what the shot sounds like. The hint, its control channels and the references already fix positions, timing and camera, so prose that restates or contradicts them competes with the stronger input.

Follow the selected model's own prompting guide, linked in [diffusion models](diffusion.md); the rules here are what those guides share.

## Content

### Plain prose

Describe the finished shot in plain prose, in this order: camera and framing, each figure, the single action, the setting, light and palette, style, then sound. Natural sentences steer better than keyword lists, and pasted tag-style prompts from another model lose meaning.

### One move, one action

Give each shot one camera move and one subject action, written as countable beats ("takes three steps and stops at the rail"). Several moves or actions in one request blur, morph or drop. Split the shot instead, or use the model's own timestamp or multi-shot syntax when it has one.

### One description per subject

Name each figure as the person or thing it becomes, by its reference token or element name when the model binds references ("the woman from Image 1, in a navy wool coat"). Reuse the identical description, palette words and light logic in every shot of the same subject, because a reworded description is a different character to the model.

### What to show

Describe what to show, not what to avoid, because a negated word still primes its concept. Where the model has a negative field, list plain nouns there ("mannequin, clay, plastic, untextured render") without "no" or "don't".

### Settings stay out of prose

Keep duration, size, frame rate and seed in the request's settings. Prose such as "make it longer" changes nothing.

## Coarse figures and controls

The hint's figures are gray and coarse. Strength is the setting for how far a model may depart from its input video: at low strength a model keeps their look and returns mannequins, robots or clay; at high strength it frees the look but loses the motion. Choose the input so motion and appearance arrive through different channels.

### Structural control

With a pose, depth, edge or layout control, describe appearance, material, light and style only. The control carries the motion, and words about motion or structure fight it.

### Raw hint video

State the video's role in one sentence ("the input video supplies only camera, positions, timing and occlusion") and map each coarse figure to its reference. Never describe the gray look positively: words such as "3D", "render", "clay", "gray" or "model" in the positive prompt pull the result toward the coarse figure.

### First frame or keyframe

When the model accepts one, give appearance there: an image made from the hint's own first frame under [image](../image/SKILL.md), so the generated shot starts in the hint's pose and camera.

## Sound

Write the shot's sound, decided under [audio](../audio/SKILL.md), in the model's syntax: usually each line in quotes after a named speaker whose name matches the visual description, then separate effect and ambience lines. When the model makes no sound, leave sound out of the prompt; audio owns that case.

## Check before submitting

Compare the prompt with the hint's start, middle and end frames: every visible figure is named once, no sentence contradicts the hint's positions, order or camera, and the prompt stays within the model's length limit. Regenerate with a stronger control or a shorter shot rather than a longer prompt when motion or camera drifts.
