# Video prompts

A video prompt tells a model what the motion hint cannot show: who each figure is, how they look and act, what the place and light look like, and what the shot sounds like. The hint, its control channels and the references already fix positions, timing and camera, so prose that restates or contradicts them competes with the stronger input.

Follow the selected model's own prompting guide, as [video models](models.md) links them. The rules here are the defaults most of those guides share, and where the selected guide asks otherwise, it wins.

Write the prompt in plain prose, in this order: the inputs' roles, the shared description, the request paragraph, then sound. Natural sentences steer better than keyword lists, and pasted tag-style prompts from another model lose meaning.

## Input roles

The hint's figures are gray and coarse, so motion and appearance arrive through different inputs, as [requests](../requests.md#inputs) assigns them. State each input's role in one sentence, in the model's wording, with what the request's [adherence](../requests.md#adherence) keeps ("the input video supplies only camera, positions and timing").

Name each polygon man and coarse form as what it becomes, never by its look in the hint, such as clay or 3D.

## From the story

A prompt is put together from what the story already decided, so no request invents an appearance or a performance. A decision the prompt needs and no record holds is made under [repair](../../story/correction/repair.md), never in the prompt.

### Shared description

Write each person, place and prop once per wardrobe, makeup or wound state, from the record that owns it, and the film's look once, from [project context](../../production/project-context.md). Keep them in one file that every request cites, where [media records](../../production/media-records.md#files) puts generation requests, and reuse the identical words wherever a prompt describes them, because a reworded description is a different character to the model. Turn off any prompt rewriting the model offers, since it rewords them. Where the model's guide asks, leave out what a first frame already shows.

### Request paragraph

Write what happens in the request's interval from the [beat records](../../story/layers/notation.md#records) of its beats:

| From the beats | The paragraph says |
| --- | --- |
| Cast | Which polygon man becomes which person, by the reference token or element name when the model binds references, and by screen position |
| Reaction | Each reaction the hint cannot show, such as a facial expression, in the order the hint performs the beats |
| Camera | The depth of field and focus the screenplay decides; the hint carries framing, moves and lens |

Leave out what the request keeps from the hint, such as positions, actions, timing and camera moves. Write the action and the camera, from the same beat records, only where the hint does not carry them.

## Sound

Write the request's sound, decided under [audio](../../audio/SKILL.md), in the dialogue form the selected model's current guide gives, because forms differ and quotation marks render a line as on-screen text in one model. Attribute each line to its speaker as the visual description names them, and keep effects, ambience and music apart from speech. When the model makes no sound, leave sound out of the prompt; audio owns that case.

## Wording

Describe what to show, not what to avoid, because a negated word still primes its concept. Use a negative field or exclusion wording only as the model's guide describes, as for a model that adds music or subtitles unless told not to.

Keep duration, size, frame rate and seed in the request's settings, because prose such as "make it longer" changes nothing.

### Still frames

A model that takes only still frames gets no motion from the hint. Write one camera move per request and its actions as countable steps ("takes three steps and stops at the rail"), because a chain of several is followed less reliably.

## Check before submitting

Compare the prompt with the hint's start, middle and end frames: every visible figure is named once, no sentence contradicts the hint's positions, order or camera, and the prompt stays within the model's length limit.