# Finishing

An accepted take is finished before [assembly](../production/assembly.md), in this order: repair, upscale, conform the frame rate, then match it to its neighbors. Each step makes a derivative kept beside the take's original under [media records](../production/media-records.md#records). A take's sound is finished separately under [film sound](../audio/film-sound.md).

## Partial repair

A take that is right except for a local flaw, such as a hand, a face, a stray object or a failed seam, is repaired in place rather than regenerated, by one of these methods:

- regenerate a time range and keep the rest;
- regenerate a masked region over its frames;
- edit by instruction, saying what changes and that everything else stays;
- re-sync a face to the accepted dialogue audio with a dubbing model.

A dubbing model regenerates the head and body around the mouth, follows the take's camera only approximately and often returns a lower resolution, so recheck identity and contacts after it; [video models](diffusion/models.md#other-roles) shows examples.

Compare the frames outside the repair with the original at matched times, and check the boundary frames one by one, because the kept frames are re-encoded too.

Composite legible text, signs and logos in post from their own clean render, because models garble lettering.

## Upscaling

Upscale only the chosen and repaired take, because repair tools often return a lower resolution. A generative upscaler invents detail, so check identity on stills after it, and measure the result against the [delivery profile](../production/project-context.md).

## Frame-rate conform

Generate at the model's frame rate and conform each take to the delivery profile by the method [project context](../production/project-context.md) records:

| Method | Cost |
| --- | --- |
| Interpolation | It invents the frames at a contact, so check consecutive frames there |
| Speed change | It changes the running time and the pitch of generated sound |
| Duplicated or dropped frames | Motion judders |

## Take matching

Providers deliver anything from 8-bit SDR to HDR and EXR, and a re-encode can drop a take's color tags. Read each take's tags, such as with ffprobe, choose one working color space for the film and record it in project context, and set every take's input space explicitly before grading; SDR brought into an HDR space cannot recover what it clipped.

Grade neighboring takes to match in color and exposure, because a jump at a cut is a grade, not a reason to regenerate. A shared grain or texture over the film hides the takes' differing sharpness.

## Provenance and disclosure

Some providers sign their output with content credentials or a watermark. Editing or re-encoding with a tool that does not carry them breaks the signature, and some terms forbid removing them. Note in each take's [record](../production/media-records.md#records) whether it carries them, keep the signed originals, and hand the record and the originals to [assembly](../production/assembly.md#repair-and-delivery).

A film made with generated video may owe a disclosure where it is released, such as under Article 50 of the EU AI Act or a video platform's rules. Ask the user which disclosure the release owes, and record it in the [delivery profile](../production/project-context.md#what-to-record).

Sources: [LTX Retake](https://docs.ltx.io/api-documentation/api-reference/async-video-generation/submit-retake), [VACE](https://github.com/ali-vilab/VACE/blob/main/UserGuide.md), [Aleph prompting](https://help.runwayml.com/hc/en-us/articles/52150503729171-Aleph-2-0-Prompting-Guide), [Runway upscaling](https://help.runwayml.com/hc/en-us/articles/55474983733395-Upscaling-videos-and-images), [Topaz models](https://developer.topazlabs.com/video-models/upscaling-and-enhancement), [frame-rate conversion](https://docs.hybrik.com/tutorials/frame_rate_conversion/), [upscaling order](https://hackernoon.com/how-to-upscale-ai-generated-video-without-making-the-artifacts-worse), [Kling limitations](https://kling.ai/blog/limitations-of-current-ai-video-generation-technology), [Vertex content credentials](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/content-credentials), [AI Act Article 50](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50), [YouTube disclosure](https://support.google.com/youtube/answer/14328491).
