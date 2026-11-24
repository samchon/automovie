# Assembly and handoff

Assemble the delivered video to the scope in [project context](project-context.md).

## Film assembly

Build one film per screenplay folder. Check the [compositions](../contracts/development/composition.md#screenplay-realization) for missing or unintended repeated beats. Preserve scene order, cuts, pauses, transitions and titles. Use [frame evaluation](../motion/frame-evaluation.md) for scheduling and cut boundaries. Preserve the meaning of each [control channel](../motion/control-channels.md).

The render, captures and the Viewer draw the transitions of the film's `playback` sequence: a `crossDissolve` mixes the two shots across its overlap, and a `fade` dips through black, the outgoing shot fading out over the first half and the incoming shot fading up over the second. The `graphics` plate is mixed the same way, so it composites over the delivered film.

When the sequence has a transition, give the film a `seekShot` member. It places one shot at its own shot-local second during a film second: a transition's outgoing shot while the incoming one is live, or a shutter sample before a shot's first frame, from the shot's handle. Read only the dialogue mouths at the film second. Every other member, `optics`, `shading`, `softPropsAt`, `beforeDraw`, `marks`, `views` and the inspection sources, describes the shot last placed, at its own shot-local second, so the outgoing tail keeps its own exposure, focus and soft props. Without `seekShot`, every picture inside a transition is refused, and a shutter sample before a shot's first frame takes that frame's state, so the blur trail at a cut is shorter.

## Render

<!-- @source The [FFmpeg codec options](https://github.com/FFmpeg/FFmpeg/blob/master/doc/codecs.texi) define color_range. -->

Before scaling a new host or a changed export path, take a shot through a join and decode the result. Compare matched frames with the delivery renderer's output or the graded take supplied for assembly. If a conversion or lossy intermediate intervenes, compare on both sides of it. Check that decoded darks, highlights and colors reproduce the intended picture under the declared color range.

After [segment review](../motion/segment-review.md), use the README render command for the complete motion hint or direct 3D film. For a generated film, assemble the accepted finished takes.

Keep only the commissioned [sound](../audio/film-sound.md) and [caption tracks](captions.md). When the film declares a `sound` list, the scaffold's render command mixes it and encodes the soundtrack with the picture; without one it produces picture only. To add caption tracks or any other stream, use a documented assembly command that supports them or an approved production tool. [Measure](../review/delivery-review.md#measurement-and-comparison) the assembled file against the [profile](project-context.md#the-delivery-profile).

## Repair and delivery

Follow [delivery repairs](../review/delivery-review.md#repairs) for a failed cut. Hand off the candidate with:

- its revision, media identities, fixed inputs, source, dependencies and reproduction commands;
- checks, observers and outstanding limits;
- for a whole motion hint, each shot's name, frame range, resolved camera and chosen lens, taking the frame ranges from a [trusted render report](media-records.md#render-reports)'s `cut`;
- rights, attribution, generation requests and the derivatives they produced;
- takes with content credentials, required disclosures and any required music cue sheet from the locked cut.

Keep secrets out of the handoff.
