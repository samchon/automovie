# Video prompts

A video prompt tells a model what the motion hint cannot show: who each figure is, how they look and act, what the place and light look like, and what the shot sounds like. The hint, its control channels and the references already fix positions, timing and camera, so prose that restates or contradicts them competes with the stronger input.

Follow the selected model's own prompting guide, linked in [diffusion models](diffusion.md). The rules here are the defaults most of those guides share, and where the selected guide asks otherwise, it wins.

## Sources

A prompt is put together from what the story already decided, so no request invents an appearance or a performance. A decision the prompt needs and no record holds is made under [repair](../story/correction/repair.md), never in the prompt.

### Shared description

Write each person, place and prop once per wardrobe, makeup or wound state, from the record that owns it, and the film's look once, from [project context](../production/project-context.md). Keep them in one file under `docs/prompts/` that every request cites, and reuse the identical words wherever a prompt describes them, because a reworded description is a different character to the model. Turn off any prompt rewriting the model offers, since it rewords them.

### Request paragraph

Write what happens in the request's interval from the [beat records](../story/layers/notation.md#records) of its beats:

| From the beats | The paragraph says |
| --- | --- |
| Cast | Which polygon man becomes which person, by the reference token or element name when the model binds references, and by screen position |
| Reaction | Each reaction the hint cannot show, such as a facial expression, in the order the hint performs the beats |
| Camera | The depth of field and focus the screenplay decides; the hint carries framing, moves and lens |

Leave out what the request keeps from the hint, such as positions, actions, timing and camera moves. Write the action and the camera, from the same beat records, only where the hint does not carry them.

## Content

### Plain prose

Write the prompt in plain prose, in this order: the inputs' roles, the shared description, the request paragraph, then sound. Natural sentences steer better than keyword lists, and pasted tag-style prompts from another model lose meaning.

### What to show

Describe what to show, not what to avoid, because a negated word still primes its concept. Use a negative field only as the model's guide describes it.

### Settings stay out of prose

Keep duration, size, frame rate and seed in the request's settings. Prose such as "make it longer" changes nothing.

### Still frames

A model that takes only still frames gets no motion from the hint. Write one camera move per request and its actions as countable steps ("takes three steps and stops at the rail"), because a chain of several is followed less reliably.

## Input roles

The hint's figures are gray and coarse, so motion and appearance arrive through different inputs, as [requests](requests.md#inputs) assigns them. State each input's role in one sentence, in the model's wording, with what the request's [adherence](requests.md#adherence) keeps ("the input video supplies only camera, positions and timing").

Name the gray forms as what each one becomes, never as their appearance, such as clay or 3D.

## Sound

Write the request's sound, decided under [audio](../audio/SKILL.md), in the model's syntax: each line after a named speaker whose name matches the visual description, then separate effect and ambience lines. When the model makes no sound, leave sound out of the prompt; audio owns that case.

## Check before submitting

Compare the prompt with the hint's start, middle and end frames: every visible figure is named once, no sentence contradicts the hint's positions, order or camera, and the prompt stays within the model's length limit. When motion or camera drifts, regenerate with a stricter adherence or a shorter request rather than a longer prompt, and repair framing under [generation](generation.md#inspect-and-choose).
