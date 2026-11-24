# Audio acquisition

Adopt and clear audio sourced apart from the video model, including voice previews, dialogue, beds, scores and commissioned soundtracks.

Before wiring audio, check the installed format and mixing contracts and the delivery host's supported path. Follow [source layout](../development/source-layout.md) for setup and secrets.

## Source choice

Start with the user's recordings or provider. [Research](../story/planning/research.md) reference sounds as needed. Compare libraries, hosted and local generation by language, performance, privacy, cost and time. Reuse connectors and CLI tools.

Check [all rights layers](../production/media-records.md#records) for commercial use, adaptation, attribution and release. Check synchronization and raw-file distribution separately. For recorded music, clear composition synchronization and recording master use.

Clone or design a voice after a real person only with that person's recorded consent, and through the provider's own voice verification where it has one.

## Speech

### Generating speech

Write speech and voice descriptions as audio prompts, or clone a reference voice or convert an existing performance, under this skill's audio generation pages.

### Voice preview

Make a preview, generated as above, only when the user wants to hear voices before video generation, with effects only when requested too.

Ask the user to play it alongside the motion hint and listen. A preview is never delivered or required, and the [video prompt](../video/diffusion/prompts.md#sound) still carries the film's sound.

## Takes

### Take adoption

Keep accepted bytes and their record under [media records](../production/media-records.md#records); a regeneration is a new take until the user has heard it.

Store each generated line of a direct 3D film's [sound list](soundtrack.md#sound-list) as a mono 32-bit float WAVE file at the model's own rate, with a version 7 `IAutoMovieProductionTtsReceipt` beside it, whose JSDoc defines its fields. Generate the file once and keep the bytes, because the receipt pins its samples and the render resamples the line itself. Record a line again rather than editing its file or receipt.

Convert a take for any other output to a format the installed packages admit, at the sample rate that output requires, keeping the original.

Measure durations and trims from the accepted bytes, and place dialogue, captions, cuts and cues against them. When a line does not fit, edit the take, script or shot deliberately and have the user listen to the result.

Keep each accepted music take's tempo map with it for screenplay events and scene timing. Make the cue sheet from the locked cut under [assembly](../production/assembly.md#repair-and-delivery).
