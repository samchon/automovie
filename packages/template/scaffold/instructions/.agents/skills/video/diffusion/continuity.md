# Continuity

Every request is a separate generation, so identity, light, color and motion can jump wherever two meet. Keep them continuous by these means.

## Within a request

A model's takes drift most in their last seconds, so keep a request shorter than the model's maximum where a shot allows.

Some models cut a request into several shots by default. Turn that off for a continuous shot, and plan cuts inside a request only where the screenplay cuts there; the model's cut timing is not frame-exact unless it takes its cuts from the hint.

## Chaining requests

A request that continues an accepted take takes it as the model allows:

- its ending as a second video, where the model takes several videos with separate roles, counted against the request's total input length;
- a chain frame as its first frame, otherwise.

Choose the chain frame before the take slows toward its end, not its literal last frame, because the end eases toward stillness and drifts most. Record the chosen frame in the request, generate the earlier take a little past the seam, and state in the new prompt the pose and state at the seam.

An extend mode often takes no hint and keeps only the last frame or last seconds as context, and it returns the input joined to the new part, so [place](../generation.md#place-takes-in-time) only the new part. Where the model cannot take the continuation beside the hint, end the request at a cut.

## Across the film

Give every request the same canon references and the [shared description](prompts.md#shared-description) in identical words, because each request knows nothing of the last.

A seed is not a save file: the same seed and inputs give a similar take, not the same one, and a model update changes it. Record the seed with the model and version for tracing, and rely on references for identity.

Pass a take on to a continuation in the lossless or high-bit-depth format the model offers, because each lossy round shifts color and brightness.

A character's generated voice can change between requests; [audio](../../audio/SKILL.md#generated-sound) keeps it consistent.

## Seams

Check every seam on the consecutive frames of both takes under [comparison](../../visual-debugging/comparison.md). Repair a failed seam by regenerating its time range under [finishing](../finishing.md#repair-part-of-a-take) before regenerating either whole request.

Sources: [Vertex extend](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/extend-a-veo-video), [Kling guide](https://kling.ai/quickstart/kling-4-model-user-guide), [Seedance model](https://docs.byteplus.com/docs/en/modelark/seedance-2-5.md), [VACE](https://github.com/ali-vilab/VACE/blob/main/UserGuide.md), [chaining clips](https://hackernoon.com/how-to-chain-ai-video-clips-into-one-shot-without-the-hidden-stutter-at-every-cut), [seeds](https://hackernoon.com/why-locking-the-seed-still-wont-get-you-the-same-ai-video-shot-twice), [Runway API](https://docs.dev.runwayml.com/api.md).
