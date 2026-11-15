# Finishing

An accepted take is finished before [assembly](../production/assembly.md), in this order: repair, upscale, conform the frame rate, then match it to its neighbors. Each step makes a derivative kept beside the take's original under [media records](../production/media-records.md#records). The take's sound is finished under [film sound](../audio/film-sound.md).

## Partial repair

Repair a take that is right except for a local flaw, such as a hand, a face, a stray object or a failed seam, in place rather than regenerating it, by one of these methods:

- regenerate a time range and keep the rest;
- regenerate a masked region over its frames;
- edit by instruction, saying what changes and that everything else stays;
- re-sync a face to the accepted dialogue audio with a dubbing model.

A dubbing model regenerates the head and body around the mouth, follows the take's camera only approximately and often returns a lower resolution, so recheck identity and contacts after it; [video models](diffusion/models.md#other-roles) shows examples.

Compare the frames outside the repair with the original at matched times, and check the boundary frames one by one, because the kept frames are re-encoded too.

Composite legible text, signs and logos in post from their own clean render, because models garble lettering.

## Upscaling

Upscale only the chosen and repaired take, because repair tools often return a lower resolution. A generative upscaler, which a model's own high-resolution tier may be, invents detail, so check identity on stills afterwards and measure the result against the [delivery profile](../production/project-context.md).

## Frame-rate conform

Generate at the model's frame rate, and conform each take to the delivery profile by the method project context records:

| Method | Cost |
| --- | --- |
| Interpolation | It invents the frames at a contact, so check consecutive frames there |
| Speed change | It changes the running time and the pitch of generated sound |
| Duplicated or dropped frames | Motion judders |

## Take matching

Takes arrive in anything from 8-bit SDR to HDR, and a re-encode can drop their color tags. Read each take's tags, choose one working color space for the film and record it in project context, and set every take's input space explicitly before grading; SDR brought into an HDR space cannot recover what it clipped.

Grade neighboring takes to match in color and exposure, because a jump at a cut calls for a grade, not a regeneration. A shared grain or texture over the film hides the takes' differing sharpness.

## Provenance and disclosure

Some providers sign their output with content credentials or a watermark, which a tool that does not carry them breaks on editing or re-encoding, and some terms forbid removing them. Note in each take's [record](../production/media-records.md#records) whether it carries them, keep the signed originals, and hand both to [assembly](../production/assembly.md#repair-and-delivery).

A film made with generated video may owe a disclosure where it is released, such as under [Article 50 of the EU AI Act](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50) or a video platform's rules. Ask the user which disclosure the release owes, and record it in the [delivery profile](../production/project-context.md#the-delivery-profile).
