# Video prompts

A video prompt tells the model what the motion hint cannot show: who each figure is, how they look and act, what the place and light look like, and what the shot sounds like. The hint, its channels and the references already fix positions, timing and camera, so prose that restates or contradicts them competes with the stronger input.

The rules here are the defaults most models' prompting guides share; where the selected model's guide, linked from [video models](models.md), asks otherwise, follow the guide. Write the prompt in natural sentences, because keyword lists and tag-style prompts pasted from another model steer less. Order it as the sections below: input roles, shared description, request paragraph, then sound.

A prompt assembles what the story already decided, so no request invents an appearance or a performance. A decision the prompt needs and no record holds is made under [repair](../../story/correction/repair.md), never in the prompt.

## Input roles

The hint's figures are gray and coarse, so motion and appearance arrive through different inputs, as [requests](../requests.md#inputs) assigns them. State each input's role in one sentence, in the model's wording, with what the request's [adherence](../requests.md#adherence) keeps ("the input video supplies only camera, positions and timing"). Only that sentence names the input video itself; everywhere else, name each polygon man and coarse form as what it becomes, never by its look in the hint, such as clay or 3D.

## Shared description

Write each person, place and prop once per wardrobe, makeup or wound state, from the record that owns it, and the film's look once, from [project context](../../production/project-context.md). Keep them in one file that every request cites, where [media records](../../production/media-records.md#files) puts generation requests, and reuse the identical words wherever a prompt describes them, because a reworded description is a different character to the model. Turn off any prompt rewriting the model offers, because it rewords them. Where the model's guide asks, leave out what a first frame already shows.

## Request paragraph

Write what happens in the request's interval from the [beat records](../../story/layers/notation.md#records) of its beats:

| From the beats | The paragraph says |
| --- | --- |
| Cast | Which polygon man becomes which person, by screen position, and by the reference token or element name where the model binds references |
| Reaction | Each reaction the hint cannot show, such as a facial expression, in the order the hint performs the beats |
| Camera | The depth of field and focus the screenplay decides; the hint carries framing, moves and lens |

Leave out what the request keeps from the hint, such as positions, actions, timing and camera moves, and write action and camera only where the hint does not carry them. Where the model's guide gives a form for timed segments, time each from the frames where the hint performs its beat.

## Sound

Write the request's sound, decided under [audio](../../audio/generated-sound.md), in the dialogue form the selected model's current guide gives, because forms differ and quotation marks make one model render a line as on-screen text. Attribute each line to its speaker by the name the [shared description](#shared-description) gives, and keep effects and ambience apart from speech. Leave the scene's score out, because [film sound](../../audio/film-sound.md#one-bed-and-one-score-per-scene) lays it as one track; music played on screen stays in the prompt as the screenplay decides it. When the model makes no sound, leave sound out.

## Wording

Describe what to show, not what to avoid, because a negated word still primes its concept. Use a negative field or exclusion wording only as the model's guide describes, such as for a model that adds music or subtitles unless told not to.

Keep duration, size, frame rate and seed in the request's settings, because prose such as "make it longer" changes nothing.

## Still frames

A model that takes only still frames gets no motion from the hint. Write one camera move per request and its actions as countable steps ("takes three steps and stops at the rail"), because a chain of several moves is followed less reliably.

## Pre-submission check

Compare the prompt with the hint's start, middle and end frames: every visible figure is named once, no sentence contradicts the hint's positions, order or camera, and the prompt stays within the model's length limit.
