# Consistency

How a subject stays the same person, place or prop across every image made of it. Each image starts from the frozen canon references; the techniques below keep the result faithful to them.

## Words

Define each subject once in its record's words and repeat its defining details in every prompt: face, build, each garment and its color. A phrase such as "same as before" drifts, because the model does not hold the earlier image's details.

## References

Give the canon references as separate input images, each with its role, as [prompting](prompting.md#input-images) sets. For an angle the canon references lack, give earlier accepted views beside them, never alone. Where two subjects share an image, give each its own references and say which figure each belongs to.

Where the model returns a related set of images from one request, make a subject's views together in it, because one generation shares its details across the set.

## Adapters

A compatible image-prompt adapter trades the reference's appearance against the text through its strength. Use the adapter's documented defaults, masks and style or identity controls for the intended role. Where supported, bind each subject to its own region so references do not blend; check component terms under [models](models.md#structure-and-identity-adapters).

## Character LoRA

A recurring character can take a LoRA matched to the base checkpoint, trained on its frozen canon references and accepted images, never the coarse hint. Include varied poses, angles and light, with close-ups and full shots.

The checkpoint's training guide owns resolution, captions, trigger tokens and regularization. Compare samples for identity and variation, and stop before they merely copy the training images.

Freeze the trained weights with a record of their training images, as an accepted image is frozen.
