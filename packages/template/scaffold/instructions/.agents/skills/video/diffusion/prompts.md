# Video prompts

Describe identity, appearance, visible action, setting, light and sound where inputs leave them open. Preserve positions, timing and camera supplied by the hint and references.

Use natural sentences for input roles, shared description, request and sound. Follow the chosen [model's guide](models.md) for its required format.

A prompt assembles what the story already decided and invents no appearance or performance. A decision it needs and no record holds is made under [repair](../../story/correction/repair.md), never in the prompt.

## Prompt parts

### Input roles

State each input's role, as its request plans it, in the model's wording, with what the request's adherence keeps. Name the hint video only there; elsewhere, describe the people and objects as they will appear in the finished film.

### Shared description

Write each person, place and prop once per wardrobe, makeup or wound state, from the record that owns it, and the film's look once, from [project context](../../production/project-context.md).

Cite the [shared descriptions](../../production/media-records.md) in each request. Reuse their exact text, disable prompt rewriting and omit visible first-frame details if the guide requires it.

### Request paragraph

Write what happens in the request's interval from the [beat records](../../story/layers/notation.md#records) of its beats:

| From the beats | The paragraph says |
| --- | --- |
| Cast | Which polygon man becomes which person |
| Reaction | Each reaction the hint cannot show, such as a facial expression |
| Camera | The depth of field and focus the screenplay decides |

Identify each polygon man by screen position, and by the reference token or element name where the model binds references. Write the reactions in the order the hint performs the beats.

State action or camera details the hint does not carry. Where supported, time prompt segments from the performed beat's frames.

### Sound

Use the model's documented dialogue notation and the audio skill's generated sound decisions. Name the speaker as in the shared description. Separate dialogue, effects and ambience.

Leave the scene's score out, because [film sound](../../audio/film-sound.md#one-bed-and-one-score-per-scene) lays it as one track; music played on screen stays as the screenplay decides it. When the model makes no sound, leave sound out.

## Wording

Describe what to show, not what to avoid, because a negated word still primes its concept. Use a negative field or exclusion wording only as the model's guide describes, such as for a model that adds music or subtitles unless told not to.

Keep duration, size, frame rate and seed in the request's settings, because prose such as "make it longer" changes nothing.

## Still frames

A model that takes only still frames gets no motion from the hint. Write one camera move per request, because a chain of moves is followed less reliably, and its actions as countable steps, such as "takes three steps and stops at the rail".

## Pre-submission check

Compare the prompt with the hint's start, middle and end frames: every visible figure is named once, no sentence contradicts the hint's positions, order or camera, and the prompt stays within the model's length limit.
