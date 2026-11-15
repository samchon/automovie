# Continuity

Every request is a separate generation, so identity, light, color and motion can jump wherever two meet. [Requests](../requests.md#intervals) sets where requests end; this page keeps them continuous across those ends.

## Chaining requests

A request that continues an accepted take takes the take's ending as a second video where the model takes several videos with separate roles, and that ending counts against the request's total input length. Otherwise the request takes a chain frame as its first frame.

Choose the chain frame before the take slows toward its [drifting end](../requests.md#intervals), not its literal last frame. Record the chosen frame in the request, and state in the new prompt the pose and state at the seam.

Pass the take on in the lossless or high-bit-depth format the model offers, because each lossy round shifts color and brightness.

An extend mode often takes no hint and keeps only the last frame or last seconds as context, and [place takes in time](../generation.md#placement-in-time) places its result. Where the model cannot take the continuation beside the hint, end the request at a cut; a continuous shot longer than one request then needs another model, so tell the user.

## Across the film

Give every request the same canon references and the [shared description](prompts.md#shared-description), because each request knows nothing of the last. Rely on those references for identity, never on a seed, as [media records](../../production/media-records.md#records) explains.

Where the model offers an element or subject, bind a character's references into it; some take only photoreal people. An open model can also take a character LoRA for a character that recurs across many requests, trained on the frozen canon references and accepted shot frames or takes, never the gray hint. A character's generated voice is kept under [audio](../../audio/SKILL.md#generated-sound).

## Seams

Check every seam on the consecutive frames of both takes under [comparison](../../visual-debugging/comparison.md). Repair a failed seam by regenerating its time range under [finishing](../finishing.md#partial-repair) before regenerating either whole request.

Sources: [Vertex extend](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/extend-a-veo-video), [Kling guide](https://kling.ai/quickstart/kling-4-model-user-guide), [Kling elements](https://kling.ai/document-api/api/video/4-0/elements.md), [Kling limitations](https://kling.ai/blog/limitations-of-current-ai-video-generation-technology), [Seedance model](https://docs.byteplus.com/docs/en/modelark/seedance-2-5.md), [VACE](https://github.com/ali-vilab/VACE/blob/main/UserGuide.md), [LTX character LoRA](https://ltx.io/blog/how-to-train-a-character-lora), [chaining clips](https://hackernoon.com/how-to-chain-ai-video-clips-into-one-shot-without-the-hidden-stutter-at-every-cut), [Runway API](https://docs.dev.runwayml.com/api.md).
