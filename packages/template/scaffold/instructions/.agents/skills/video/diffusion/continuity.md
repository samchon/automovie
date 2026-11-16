# Continuity

Every request is a separate generation, so identity, light, color and motion can jump wherever two requests meet. [Requests](../requests.md#intervals) sets where they end; this page keeps the film continuous across those ends.

## Chaining requests

A request that continues an accepted take takes the take's ending as a second video where the model takes several videos with separate roles; that ending counts against the request's total input length. Otherwise it takes a chain frame as its first frame.

Choose the chain frame before the take slows toward its drifting end, not its literal last frame, record it in the request, and state the pose and state at the seam in the new prompt. Pass the take on in the lossless or high-bit-depth format the model offers, because each lossy round shifts color and brightness.

An extend mode often takes no hint and keeps only the last frame or seconds as context; [placement in time](../generation.md#placement-in-time) places its result. Where the model cannot take a continuation beside the hint, end the request at a cut, and tell the user that a continuous shot longer than one request needs another model.

## Across the film

Give every request the same canon references and the [shared description](prompts.md#shared-description), because each request knows nothing of the last. Rely on the references for identity, never on a seed, which [media records](../../production/media-records.md#records) explains does not reproduce a file.

Where the model offers an element or subject, bind a character's references into it; some models accept only photoreal people there. For a character that recurs across many requests, a [custom checkpoint](models.md) can also take a [character LoRA](../../image/consistency.md#character-lora) trained on the frozen canon references and accepted shot frames or takes, never on the coarse hint. A character's generated voice is kept under [generated sound](../../audio/generated-sound.md).

## Seams

Check every seam on the consecutive frames of both takes under [comparison](../../visual-debugging/comparison.md). Repair a failed seam by regenerating its time range under [partial repair](../finishing.md#partial-repair) before regenerating either whole request.
