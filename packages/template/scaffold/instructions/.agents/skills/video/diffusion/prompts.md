# Video prompts

A video prompt tells the model what the motion hint cannot show: who each figure is, how they look and act, what the place and light look like, and what the shot sounds like. The hint, its channels and the references already fix positions, timing and camera, so prose that restates or contradicts them competes with the stronger input.

These defaults are common to most models' prompting guides; the chosen model's guide, linked from [video models](models.md), wins where it differs. Write natural sentences, because keyword lists and tag-style prompts pasted from another model steer less, in the order of the parts below: input roles, shared description, request paragraph, then sound.

A prompt assembles what the story already decided and invents no appearance or performance. A decision it needs and no record holds is made under [repair](../../story/correction/repair.md), never in the prompt.

## Prompt parts

### Input roles

State each input's role, as its request plans it, in the model's wording, with what the request's adherence keeps. Name the hint video only there; elsewhere, describe the people and objects as they will appear in the finished film.

### Shared description

Write each person, place and prop once per wardrobe, makeup or wound state, from the record that owns it, and the film's look once, from [project context](../../production/project-context.md).

Keep those descriptions in one file that every request cites, where [media records](../../production/media-records.md#files) puts generation requests, and reuse the identical words in every prompt, because a reworded description is a different character to the model. Turn off any prompt rewriting the model offers, for the same reason. Where the model's guide asks, leave out what a first frame already shows.

### Request paragraph

Write what happens in the request's interval from the [beat records](../../story/layers/notation.md#records) of its beats:

| From the beats | The paragraph says |
| --- | --- |
| Cast | Which polygon man becomes which person |
| Reaction | Each reaction the hint cannot show, such as a facial expression |
| Camera | The depth of field and focus the screenplay decides |

Identify each polygon man by screen position, and by the reference token or element name where the model binds references. Write the reactions in the order the hint performs the beats.

Leave out what the request keeps from the hint, such as positions, actions, timing and the camera's framing, moves and lens; write action and camera only where the hint does not carry them. Where the model's guide gives a form for timed segments, time each from the frames where the hint performs its beat.

### Sound

Write the request's sound, as the audio skill's generated sound page decides it, in the dialogue form the chosen model's current guide gives, because forms differ and quotation marks make one model render a line as on-screen text. Attribute each line to its speaker by the name the [shared description](#shared-description) gives, and keep effects and ambience apart from speech.

Leave the scene's score out, because [film sound](../../audio/film-sound.md#one-bed-and-one-score-per-scene) lays it as one track; music played on screen stays as the screenplay decides it. When the model makes no sound, leave sound out.

## Wording

Describe what to show, not what to avoid, because a negated word still primes its concept. Use a negative field or exclusion wording only as the model's guide describes, such as for a model that adds music or subtitles unless told not to.

Keep duration, size, frame rate and seed in the request's settings, because prose such as "make it longer" changes nothing.

## Still frames

A model that takes only still frames gets no motion from the hint. Write one camera move per request, because a chain of moves is followed less reliably, and its actions as countable steps, such as "takes three steps and stops at the rail".

## Pre-submission check

Compare the prompt with the hint's start, middle and end frames: every visible figure is named once, no sentence contradicts the hint's positions, order or camera, and the prompt stays within the model's length limit.
