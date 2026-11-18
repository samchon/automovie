# Consistency

How a subject stays the same person, place or prop across every image made of it. Each image starts from the frozen canon references; the techniques below keep the result faithful to them.

## Words

Repeat each subject's defining appearance from its record in every prompt.

## References

Supply separate canon images with [roles](prompting.md#input-images). Supplement missing angles with accepted views alongside canon. Bind each figure to its own references.

Generate related views together when the model supports it.

## Adapters

Match the adapter's strength, masks and identity or style controls to their roles. Bind each subject to its own region where supported. Check component terms under [models](models.md#structure-and-identity-adapters).

## Character LoRA

A recurring character can take a LoRA matched to the base checkpoint, trained on its frozen canon references and accepted images, never the coarse hint. Include varied poses, angles and light, with close-ups and full shots.

The checkpoint's training guide owns resolution, captions, trigger tokens and regularization. Compare samples for identity and variation, and stop before they merely copy the training images.

Freeze the trained weights with a record of their training images, as an accepted image is frozen.
