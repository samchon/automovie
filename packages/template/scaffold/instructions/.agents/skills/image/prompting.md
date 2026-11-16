# Image prompting

How to write any image prompt. The chosen generator's own prompting guide, linked from [models](models.md), wins where it asks otherwise.

## Structure

Open with the subject, the image's use, its composition and its aspect, then give details and constraints; in a long prompt, label these as sections. Describe each subject in its record's words, as [consistency](consistency.md#words) sets.

Describe what the image shows rather than what it lacks, because a negated word still primes its concept. Name material, color, scale and light instead of mood words.

Camera and lens words are cues for the look, not a simulated camera, so an exact camera comes from a render under [conditioning](conditioning.md).

## Input images

Number each input image and give it one role in the prompt, such as "Image 1: identity of Mara; Image 2: the kitchen plate", never as text in the image. Say how the inputs combine and what not to take from each, such as a reference's background, and name each image in the same words every time.

Put the image the result builds on first, because some generators take the output's aspect, a mask or markup from the first input; where the generator keeps the first input's detail best and the result builds on a render, put the identity reference first and set size and aspect explicitly. Set the output size and aspect explicitly in every request, because otherwise generators take them from an input or fall back to a square.

## Lettering

Put the exact text in quotation marks with its placement and typeface, spell an unusual word letter by letter, and ask for no other text. Check spelling and legibility on the result, because a generator misspells text silently.

## Rewriting and grounding

Turn off any prompt rewriting and web grounding the generator offers, or call it through a route that sends the prompt as written. Rewriting rewords the shared description, which must stay identical, and grounding can replace an invented subject with a real one it finds.
