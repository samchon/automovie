# Assembly and handoff

Assemble the delivered video to the scope in [project context](project-context.md).

## Film assembly

Build one film per screenplay folder. Check [scene realization](../contracts/development/composition.md#screenplay-realization) and [order](../contracts/development/films.md#scene-order) for missing or unintended repeated beats. Preserve scene order, cuts, pauses, transitions, titles and [control channels](../motion/control-channels.md). Schedule cuts with [frame evaluation](../motion/frame-evaluation.md).

The render, capture and inspector use the film's `playback` transitions. `crossDissolve` mixes overlapping shots. `fade` dips through black. Both require [`seekShot`](../development/modules.md#shots-and-films).

## Render

<!-- @reference The [FFmpeg codec options](https://github.com/FFmpeg/FFmpeg/blob/master/doc/codecs.texi) define color_range. -->

For a new host or changed export, decode a shot through a join before scaling. Compare matched frames with the delivery renderer or graded take and on both sides of any conversion or lossy intermediate. Verify darks, highlights and colors under the declared color range.

After [segment review](../motion/segment-review.md), render the whole hint or direct 3D film with the README command. For generated film, assemble accepted finished takes. [Composite](../video/finishing.md#compositing) clean renders.

For a render you may need to resume, pass `--checkpoint-dir <folder>` with `--checkpoint-identity <sha256>`. Compute the identity from a manifest of the exact source, dependencies, props, assets and browser installation used by the render. Keep that manifest with the render report. The checkpoint retains native draw data for every completed frame, including guide passes when requested. A retry checks the saved frame's identity and digest before reusing it. Use a new folder after changing an input or render host. The render report lists reused indices and retained indices observed by the current attempt.

Include only commissioned [sound](../audio/film-sound.md) and [captions](captions.md). The README render command encodes picture and the film's soundtrack. Use a supporting documented assembly command or approved tool for additional streams. [Measure](../review/delivery-review.md#measurement-and-comparison) the assembled file against the [profile](project-context.md#the-delivery-profile).

## Repair and delivery

Follow [delivery repairs](../review/delivery-review.md#repairs) for a failed cut. Hand off the candidate with:

- revision, media IDs, fixed inputs, source, dependencies and rerun commands
- checks, observers and outstanding limits;
- for a hint, shot names, frame ranges, cameras and lenses;
- rights, attribution, generation requests and the derivatives they produced;
- takes with content credentials and the locked cut's required disclosures
  - Include a cue sheet if required.

Take frame ranges from `cut` in the [verified render report](media-records.md#render-reports). Keep secrets out of the handoff.
