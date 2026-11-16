# Consistency

How a subject stays the same person, place or prop across every image made of it. Each image starts from the frozen canon references, as [every image](SKILL.md#every-image) sets; the techniques below keep the result faithful to them.

## Words

Define each subject once in its record's words and repeat its defining details in every prompt: face, build, each garment and its color. A phrase such as "same as before" drifts, because the model does not hold the earlier image's details.

## References

Give the canon references as separate input images, each with its role, as [prompting](prompting.md#input-images) sets. For an angle the canon references lack, give earlier accepted views beside them, never alone. Where two subjects share an image, give each its own references and say which figure each belongs to.

Where the model returns a related set of images from one request, make a subject's views together in it, because one generation shares its details across the set.

## Adapters

An open model takes a reference through an image-prompt adapter, whose scale trades the reference's look against the prompt; start near the middle and move it until both hold. Mask each subject's adapter to that subject's region so two references do not blend, and use an adapter's style-only layers where the reference should give its look without its layout. An identity adapter keeps a face: raise its identity strength for likeness, and lower the adapter when colors oversaturate. Each adapter's license is its own, as [models](models.md) notes.

## Character LoRA

A character that recurs across many images on an open model can take a small LoRA, trained on its frozen canon references and accepted images, never the coarse hint. Give it images of 1024 pixels or more in varied poses, angles and light, close-ups as well as full shots, each with a descriptive caption that carries one trigger word. Check samples during training and stop before they copy the training images, because a face overfits fast; a trainer's prior preservation keeps the base model's other people intact.

Freeze the trained weights with a record of their training images, as [every image](SKILL.md#every-image) freezes an accepted image.
