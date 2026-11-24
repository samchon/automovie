# Finishing

Before [assembly](../production/assembly.md), repair, upscale, conform and match each accepted take in order. Keep derivatives beside the original under [media records](../production/media-records.md#records). Follow [film sound](../audio/film-sound.md) for sound.

## Finishing steps

### Partial repair

Repair a take that is right except for a local flaw, such as a hand or a failed seam, in place rather than regenerating it, by one of these methods:

- regenerate a time range and keep the rest;
- regenerate a masked region over its frames;
- edit by instruction, saying what changes and that everything else stays;
- re-sync a face to the accepted dialogue audio with a dubbing model.

A dubbing model regenerates the head and body around the mouth, follows the take's camera only approximately and often returns a lower resolution, so recheck identity and contacts after it; [video models](diffusion/models.md#other-roles) shows examples.

Compare untouched frames at matched times and step through the repair boundaries. Re-encoding can affect both.

Composite legible text, signs, screens and logos in post from their own clean render, because models garble lettering. For surface graphics, flat lettering included, that render is the `graphics` pass, which `pnpm run render --subject <film> --passes graphics` writes as RGBA frames into `videos/controls/`. Its straight alpha is the surface graphics' coverage, with everything in front of them held out, and a see-through blended glass only by its opacity. Raised lettering is ordinary geometry and stays out of that pass; lift it from the beauty pass through its node's mask region.

Unlike the structural passes, which show only the shot a frame shows most of, the plate goes through a transition as the picture does: a dissolve mixes the two shots' plates by their weights, and a fade dips the plate's coverage to 0 at its midpoint. Composite it over the delivered film frame for frame, without cutting it at the transition.

To composite whole 3D subjects over a generated take, render the film with `pnpm run render --subject <film> --background transparent`, which writes a straight-alpha `film.mov` with no audio into `media/automovie/<film>/transparent/`. Use either render only under the [render report check](../production/media-records.md#render-reports) of its folder.

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

## Provenance and disclosure

Record credentials and watermarks under [media records](../production/media-records.md#records). Preserve signed originals and required markers. Pass them to [assembly](../production/assembly.md#repair-and-delivery).

A film made with generated video may owe a disclosure where it is released, such as under [Article 50 of the EU AI Act](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50) or a video platform's rules. Ask the user which one the release owes, and record it in the [delivery profile](../production/project-context.md#the-delivery-profile).
