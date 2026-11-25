# Assembly and handoff

Assemble the delivered video to the scope in [project context](project-context.md).

## Film assembly

Build one film per screenplay folder. Check the [scenes](../contracts/development/composition.md#screenplay-realization) and the film's [scene order](../contracts/development/films.md#scene-order) for missing or unintended repeated beats. Preserve scene order, cuts, pauses, transitions and titles. Use [frame evaluation](../motion/frame-evaluation.md) for scheduling and cut boundaries. Preserve the meaning of each [control channel](../motion/control-channels.md).

The render, captures and the inspector draw the transitions of the film's `playback` sequence: a `crossDissolve` mixes the two shots across its overlap, and a `fade` dips through black. A film with a transition needs the `seekShot` member [modules](../development/modules.md#shots-and-films) sets.

## Render

<!-- @source The [FFmpeg codec options](https://github.com/FFmpeg/FFmpeg/blob/master/doc/codecs.texi) define color_range. -->

Before scaling a new host or a changed export path, take a shot through a join and decode the result. Compare matched frames with the delivery renderer's output or the graded take supplied for assembly. If a conversion or lossy intermediate intervenes, compare on both sides of it. Check that decoded darks, highlights and colors reproduce the intended picture under the declared color range.

After [segment review](../motion/segment-review.md), use the README render command for the complete motion hint or direct 3D film. For a generated film, assemble the accepted finished takes. Then composite clean renders under [compositing](../video/finishing.md#compositing).

Keep only the commissioned [sound](../audio/film-sound.md) and [caption tracks](captions.md). The README render command encodes the picture and, as the README describes, the film's soundtrack, but no other stream. To add caption tracks or any other stream, use a documented assembly command that supports them or an approved production tool. [Measure](../review/delivery-review.md#measurement-and-comparison) the assembled file against the [profile](project-context.md#the-delivery-profile).

## Repair and delivery

Follow [delivery repairs](../review/delivery-review.md#repairs) for a failed cut. Hand off the candidate with:

- its revision, media identities, fixed inputs, source, dependencies and reproduction commands;
- checks, observers and outstanding limits;
- for a hint, shot names, frame ranges, cameras and lenses;
- rights, attribution, generation requests and the derivatives they produced;
- takes with content credentials, required disclosures and any required music cue sheet from the locked cut.

Take frame ranges from `cut` in the [verified render report](media-records.md#render-reports). Keep secrets out of the handoff.
