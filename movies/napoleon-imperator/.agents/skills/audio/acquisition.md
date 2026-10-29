# Audio acquisition

Speech generation and recording happen outside deterministic replay; installed package contracts own admitted audio formats and mixing capabilities. Read the installed packages' READMEs, public types, and this production's host before wiring acquisition output into a render. The presence of a decoder or mixer does not establish that this project's delivery entry point uses it.

Apply the chosen output and sound scope from [production decisions](../production/profile.md). Required sound can accompany a commissioned motion hint or finished direct 3D film; neither route requires a particular provider. Keep API/local choices and setup authority there, actual setup/run commands in README, variable names in .env.example, secrets in a Git-ignored .env, and integration implementation in source. A saved environment file alone does not wire the host.

## Choose a source

Use the user's supplied assets or chosen provider first. When no source is chosen, compare the options against the required language, performance, privacy, cost, available hardware, and turnaround; no provider is required by this scaffold.

| Source | When it fits | Operational reference |
| --- | --- | --- |
| Existing recording or licensed library | The required performance or sound already exists | Its owner and usage terms |
| Hosted speech or audio service | Its voices, language support, or managed operation fit the production | That provider's current documentation and the user's configured account |
| Local generation | The user wants local control and has suitable hardware and setup time | The selected tool's current installation and usage documentation |

Use existing connectors, command-line tools, and provider interfaces before adding acquisition code. Keep credentials outside production source and asset records.

## Adopt a take

Keep the accepted audio in project-owned static assets, for example `public/audio`, and record its source, usage rights, content digest, and any generation or conversion settings alongside the production's asset records. A regeneration becomes a new take until reviewed; a seed alone does not preserve the accepted bytes.

Use the installed decoder's admitted format when converting a provider's output; its public contract owns codec, channel, and sample-rate support. Preserve the original when conversion changes the audio, and record which bytes enter the render. Measure durations and trims from those bytes rather than text length or requested synthesis duration.

Place dialogue, captions, mouth motion, cuts, and sound cues against the accepted performance and the production's clock. When a line does not fit, choose an intentional edit to the take, script, or shot; verify any time fitting by listening to its result. Keep recognition or alignment output tied to the accepted take, since editing its bytes can invalidate those timings.

## Listen and trace failures

Listen to each adopted take for the intended words, pronunciation, performance, and unwanted noise. For the commissioned artifact, listen to the actual delivered audio for intelligibility, clipping, missing cues, transitions and the ending. Include picture and synchronization checks when video is part of that output. A waveform, timing report, successful render, or procedural stand-in does not establish that the intended recording is audible.

Inspect the actual delivery path when an asset is missing or the result differs from the accepted take. Fix acquisition, asset identity, timing, or host wiring at its owner, and review the affected delivery together. State which takes and delivered sections were heard and what remains unchecked.

Use [delivery review](../review/delivery.md) for final assembled acceptance and handoff; these listening checks supply the audio observations it needs.
