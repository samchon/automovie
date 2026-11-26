# Finishing

Before assembly, repair, upscale, conform and match each accepted take in order. Composite clean renders as compositing sets. Keep derivatives beside the original under [media records](../production/media-records.md#records). Follow [film sound](../audio/film-sound.md) for sound.

## Finishing steps

### Partial repair

Repair a take that is right except for a local flaw, such as a hand or a failed seam, in place rather than regenerating it, by one of these methods:

- regenerate a time range and keep the rest;
- regenerate a masked region over its frames;
- edit by instruction, saying what changes and that everything else stays;
- re-sync a face to the accepted dialogue audio with a dubbing model.

A dubbing model regenerates the head and body around the mouth, follows the take's camera only approximately and often returns a lower resolution, so recheck identity and contacts after it; [video models](diffusion/models.md#other-roles) shows examples.

Compare untouched frames at matched times and step through the repair boundaries. Re-encoding can affect both.

### Upscaling

Upscale only the selected, repaired take. Verify identity on stills after generative upscaling and check the [delivery profile](../production/project-context.md#the-delivery-profile).

### Frame-rate conform

Generate at the model's frame rate, and conform each take to the delivery profile by the method project context records:

| Method | Cost |
| --- | --- |
| Interpolation | It invents the frames at a contact, so check consecutive frames there |
| Speed change | It changes the running time and the pitch of generated sound |
| Duplicated or dropped frames | Motion judders |

### Take matching

Read take color tags. Record one working color space in project context and assign each take's input space before grading. Preserve tags across encoding and account for SDR clipping.

Match neighboring takes in color and exposure by grading, never by regenerating. A shared grain or texture over the film hides their differing sharpness.

## Compositing

Composite a clean render's graphics over the assembled film. Composite whole 3D subjects over their take, before assembly.

Composite legible text, signs, screens and logos in post from their own clean render, because models garble lettering. For surface graphics, flat lettering included, that render is the `graphics` guide pass of the README render command's `--passes` option. Composite it by the alpha convention its `record.json` names. Raised lettering is ordinary geometry and stays out of that pass, so lift it from the beauty pass through its node's mask region.

The `graphics` pass goes through a transition as the picture does, so composite it frame for frame, without cutting it at the transition.

To composite whole 3D subjects over a generated take, render the film with the README render command's `--background transparent` option. Use either render only under the [render report check](../production/media-records.md#render-reports) of its folder.

## Provenance and disclosure

Record credentials and watermarks under [media records](../production/media-records.md#records). Preserve signed originals and required markers. Include them at handoff.

A film made with generated video may owe a disclosure where it is released, such as under [Article 50 of the EU AI Act](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50) or a video platform's rules. Ask the user which one the release owes, and record it in the [delivery profile](../production/project-context.md#the-delivery-profile).
